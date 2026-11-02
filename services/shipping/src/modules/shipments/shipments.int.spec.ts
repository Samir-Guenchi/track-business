import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { CarrierRegistry } from '@trackecom/carriers';
import type { FakeCarrier } from '@trackecom/carriers/testing';
import {
  type EventEnvelope,
  SHIPMENT_EVENTS,
  type ShipRequestedEvent,
  ShipmentCreatedEventSchema,
  ShipmentFailedEventSchema,
} from '@trackecom/contracts';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { CarrierAccountsService } from '../carriers/application/carrier-accounts.service.js';
import { parseCommunesCsv } from '../geo/infrastructure/seed/parse-communes-csv.js';
import { seedGeo } from '../geo/infrastructure/seed/seed-geo.js';
import { CreateShipmentUseCase } from './application/create-shipment.use-case.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '12121212-1212-4212-8212-121212121212';
const UNCONNECTED = '13131313-1313-4313-8313-131313131313';
const COMMUNES = `id,wilaya_code,name_fr,name_ar,postal_code,aliases
1601,16,Bab Ezzouar,باب الزوار,16111,
3101,31,Es Senia,السانية,,`;

const shipRequest = (overrides: Partial<ShipRequestedEvent> = {}): ShipRequestedEvent => ({
  orderId: randomUUID(),
  reference: `ORD-${Math.floor(Math.random() * 1e6)}-v3`,
  carrier: 'fake',
  originWilayaCode: 16,
  recipient: { name: 'Client Test', phone: '+213555000009', phone2: null, address: 'Rue A' },
  wilayaCode: 31,
  communeId: 3101,
  deliveryType: 'home',
  stopDeskId: null,
  codAmount: 3100,
  declaredValue: 2500,
  contents: '1 x Robe',
  notes: null,
  ...overrides,
});
const envelope = (data: ShipRequestedEvent, storeId = STORE): EventEnvelope => ({
  id: randomUUID(),
  type: SHIPMENT_EVENTS.shipRequested,
  occurredAt: new Date().toISOString(),
  storeId,
  correlationId: randomUUID(),
  data,
});

describe.skipIf(!baseUrl || !redisUrl)('shipment creation (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=shipping_shipments_test`;
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let create: CreateShipmentUseCase;
  let fake: FakeCarrier;

  const outbox = async (type: string) =>
    (await prisma.outboxEvent.findMany({ where: { type } })).map(
      (row) => (row.payload as { data: unknown }).data,
    );

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    app = await startTestApp(testEnv({ DATABASE_URL: databaseUrl, REDIS_URL: redisUrl }));
    prisma = app.get(PrismaService);
    await seedGeo(prisma, parseCommunesCsv(COMMUNES), 'test');
    await prisma.carrierAccount.deleteMany();
    await app.get(CarrierAccountsService).connect(STORE, 'fake', { token: 'valid' });
    create = app.get(CreateShipmentUseCase);
    fake = app.get(CarrierRegistry).get('fake') as FakeCarrier;
  });

  beforeEach(async () => {
    await prisma.outboxEvent.deleteMany();
    await prisma.shipment.deleteMany();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('creates the parcel once, with place names, and announces it', async () => {
    const request = shipRequest();
    const event = envelope(request);

    expect(await create.execute(event)).toBe('created');
    expect(await create.execute(event)).toBe('duplicate');

    const parcel = fake.parcels.get(request.reference);
    expect(parcel?.request).toMatchObject({
      wilayaName: 'Oran',
      communeName: 'Es Senia',
      origin: { wilayaCode: 16, wilayaName: 'Alger' },
    });
    const shipment = await prisma.shipment.findFirstOrThrow({
      where: { reference: request.reference },
    });
    expect(shipment).toMatchObject({ storeId: STORE, orderId: request.orderId, status: 'created' });
    expect(shipment.publicCode).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(shipment.nextPollAt).not.toBeNull();
    const [created] = await outbox(SHIPMENT_EVENTS.created);
    expect(ShipmentCreatedEventSchema.parse(created)).toMatchObject({
      orderId: request.orderId,
      trackingNumber: parcel?.trackingNumber,
      publicCode: shipment.publicCode,
    });
  });

  it('reports a carrier the store never connected', async () => {
    const request = shipRequest();

    expect(await create.execute(envelope(request, UNCONNECTED))).toBe('failed');

    const [failed] = await outbox(SHIPMENT_EVENTS.failed);
    expect(ShipmentFailedEventSchema.parse(failed)).toMatchObject({
      orderId: request.orderId,
      reason: 'not_connected',
    });
    expect(await prisma.shipment.count()).toBe(0);
  });

  it('reports a commune that is not in the wilaya', async () => {
    expect(await create.execute(envelope(shipRequest({ communeId: 1601 })))).toBe('failed');

    const [failed] = await outbox(SHIPMENT_EVENTS.failed);
    expect(failed).toMatchObject({ reason: 'invalid_request' });
  });
});
