import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  type EventEnvelope,
  SHIPMENT_EVENTS,
  ShipOrdersResponseSchema,
  ShipRequestedEventSchema,
} from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { ApplyShipmentStatusUseCase } from './application/apply-shipment-status.use-case.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '46464646-4646-4646-8646-464646464646';
const USERS = {
  manager: 'a0000000-0000-4000-8000-000000000046',
  agent: 'a0000000-0000-4000-8000-000000000047',
} as const;
type User = keyof typeof USERS;

const newOrder = {
  customer: {
    name: 'Client Test',
    phone: '0555 00 00 05',
    wilayaCode: 31,
    communeId: 3101,
    address: 'Rue B',
  },
  items: [
    { name: 'Robe', quantity: 2, unitPrice: 2500 },
    { name: 'Sac', quantity: 1, unitPrice: 1500 },
  ],
  deliveryType: 'home',
  shippingFee: 600,
};

// Shares the orders API schema: pg_trgm lives there, and files run one at a time.
describe.skipIf(!baseUrl || !redisUrl)('ship orders (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=orders_api_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let prisma: PrismaService;
  const headers: Partial<Record<User, Record<string, string>>> = {};

  const ship = (user: User, orderIds: string[]) =>
    app.inject({
      method: 'POST',
      url: '/orders/ship',
      headers: headers[user] ?? {},
      payload: { orderIds, carrier: 'yalidine', originWilayaCode: 16 },
    });
  const confirmedOrder = async (): Promise<string> => {
    const response = await app.inject({
      method: 'POST',
      url: '/orders',
      headers: headers.manager ?? {},
      payload: newOrder,
    });
    const { id } = response.json() as { id: string };
    await prisma.order.update({ where: { id }, data: { status: 'confirmed' } });
    return id;
  };
  const order = (id: string) => prisma.order.findUniqueOrThrow({ where: { id } });
  const shipmentEvent = (type: string, data: Record<string, unknown>): EventEnvelope => ({
    id: randomUUID(),
    type,
    occurredAt: new Date().toISOString(),
    storeId: STORE,
    correlationId: randomUUID(),
    data,
  });

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({
      [USERS.manager]: { [STORE]: 'manager' },
      [USERS.agent]: { [STORE]: 'agent' },
    });
    for (const [user, id] of Object.entries(USERS) as [User, string][]) {
      headers[user] = {
        authorization: `Bearer ${await identity.tokenFor(id)}`,
        'x-store-id': STORE,
      };
    }
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
    prisma = app.get(PrismaService);
    await prisma.order.deleteMany({ where: { storeId: STORE } });
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('requests a parcel for confirmed orders and skips the others', async () => {
    const id = await confirmedOrder();
    const missing = randomUUID();

    const response = await ship('manager', [id, missing]);
    const again = await ship('manager', [id]);

    expect(response.statusCode).toBe(202);
    expect(ShipOrdersResponseSchema.parse(response.json()).items).toEqual([
      { orderId: id, status: 'requested' },
      { orderId: missing, status: 'skipped', code: 'orders.not_found' },
    ]);
    expect(again.json()).toEqual({
      items: [{ orderId: id, status: 'skipped', code: 'orders.illegal_transition' }],
    });
    const stored = await order(id);
    expect(stored.status).toBe('ready_to_ship');
    const [row] = await prisma.outboxEvent.findMany({
      where: { type: SHIPMENT_EVENTS.shipRequested, storeId: STORE },
    });
    const request = ShipRequestedEventSchema.parse((row?.payload as { data: unknown }).data);
    expect(request).toMatchObject({
      orderId: id,
      reference: `${stored.ref}-v${stored.version}`,
      contents: '2 x Robe, 1 x Sac',
      codAmount: stored.codAmount,
    });
  });

  it('refuses agents, who cannot ship', async () => {
    const response = await ship('agent', [await confirmedOrder()]);

    expect(response.statusCode).toBe(403);
  });

  it('ships the order when the parcel exists, and brings it back when refused', async () => {
    const apply = app.get(ApplyShipmentStatusUseCase);
    const shipped = await confirmedOrder();
    const refused = await confirmedOrder();
    await ship('manager', [shipped, refused]);
    const common = { reference: 'ref', carrier: 'yalidine' };

    await apply.created(
      shipmentEvent(SHIPMENT_EVENTS.created, {
        ...common,
        shipmentId: randomUUID(),
        orderId: shipped,
        trackingNumber: 'yal-ABC123',
        publicCode: 'pUbLiCcOdE_0123456789',
        labelUrl: null,
        codAmount: 6100,
      }),
    );
    await apply.failed(
      shipmentEvent(SHIPMENT_EVENTS.failed, {
        ...common,
        orderId: refused,
        reason: 'not_connected',
        message: 'Connect this carrier before shipping with it',
      }),
    );

    expect(await order(shipped)).toMatchObject({
      status: 'shipped',
      carrier: 'yalidine',
      trackingNumber: 'yal-ABC123',
    });
    expect((await order(refused)).status).toBe('confirmed');
  });
});
