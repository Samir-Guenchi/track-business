import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { TrackingUpdate } from '@trackecom/carriers';
import {
  OrderTrackingResponseSchema,
  PublicTrackingResponseSchema,
  TRACKING_EVENTS,
} from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { TrackingIngestService } from './application/tracking-ingest.service.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '77777777-7777-4777-8777-777777777777';
const OTHER = '88888888-8888-4888-8888-888888888888';
const ORDER = 'c0000000-0000-4000-8000-000000000001';
const SHIPMENT = 'd0000000-0000-4000-8000-000000000001';
const OWNER = 'b0000000-0000-4000-8000-000000000011';
const RIVAL = 'b0000000-0000-4000-8000-000000000012';
const CODE = 'pUbLiCcOdE_0123456789';
const SOURCE = { storeId: STORE, carrier: 'yalidine' };

const scan = (
  rawStatus: string,
  status: TrackingUpdate['events'][number]['status'],
  hour: number,
) => ({
  rawStatus,
  status,
  at: new Date(Date.UTC(2026, 10, 1, hour)),
  location: 'Oran',
  note: 'Appeler avant',
  failureReason: null,
});
const update = (...events: TrackingUpdate['events']): TrackingUpdate => ({
  trackingNumber: 'yal-TEST01',
  events,
});

describe.skipIf(!baseUrl || !redisUrl)('tracking timeline (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=shipping_tracking_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let prisma: PrismaService;
  let ingest: TrackingIngestService;
  const auth: Record<string, Record<string, string>> = {};

  const outboxTypes = async () =>
    (await prisma.outboxEvent.findMany({ orderBy: { occurredAt: 'asc' } })).map((e) => e.type);

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({
      [OWNER]: { [STORE]: 'agent' },
      [RIVAL]: { [OTHER]: 'owner' },
    });
    auth['owner'] = {
      authorization: `Bearer ${await identity.tokenFor(OWNER)}`,
      'x-store-id': STORE,
    };
    auth['rival'] = {
      authorization: `Bearer ${await identity.tokenFor(RIVAL)}`,
      'x-store-id': OTHER,
    };
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
    prisma = app.get(PrismaService);
    ingest = app.get(TrackingIngestService);
  });

  beforeEach(async () => {
    await prisma.outboxEvent.deleteMany();
    await prisma.shipment.deleteMany();
    await prisma.shipment.create({
      data: {
        id: SHIPMENT,
        storeId: STORE,
        orderId: ORDER,
        carrier: 'yalidine',
        reference: 'ORD-1-1',
        trackingNumber: 'yal-TEST01',
        publicCode: CODE,
      },
    });
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('applies carrier events once, even when they arrive twice', async () => {
    const batch = update(
      scan('Expédié', 'picked_up', 8),
      scan('En livraison', 'out_for_delivery', 9),
    );

    const first = await ingest.ingest(SOURCE, batch);
    const replay = await ingest.ingest(SOURCE, batch);

    expect(first?.plan.transitions).toHaveLength(2);
    expect(replay?.plan.transitions).toEqual([]);
    expect(await prisma.trackingEvent.count()).toBe(2);
    expect(await outboxTypes()).toEqual([
      TRACKING_EVENTS.statusChanged,
      TRACKING_EVENTS.statusChanged,
    ]);
    const shipment = await prisma.shipment.findUniqueOrThrow({ where: { id: SHIPMENT } });
    expect(shipment).toMatchObject({ status: 'out_for_delivery', version: 3 });
    expect(shipment.nextPollAt).not.toBeNull();
  });

  it('keeps unmapped carrier labels on the timeline and alerts them', async () => {
    await ingest.ingest(SOURCE, update(scan('Colis bloqué', null, 10)));

    expect(await prisma.trackingEvent.count()).toBe(1);
    expect(await outboxTypes()).toEqual([TRACKING_EVENTS.unknownCarrierStatus]);
  });

  it('ignores a tracking number it does not know', async () => {
    const result = await ingest.ingest(SOURCE, { trackingNumber: 'other', events: [] });

    expect(result).toBeNull();
  });

  it('serves the order timeline to its store only', async () => {
    await ingest.ingest(SOURCE, update(scan('Livré', 'delivered', 11)));
    const url = `/tracking/orders/${ORDER}`;

    const own = await app.inject({ method: 'GET', url, headers: auth['owner'] ?? {} });
    const rival = await app.inject({ method: 'GET', url, headers: auth['rival'] ?? {} });

    const body = OrderTrackingResponseSchema.parse(own.json());
    expect(body.items[0]?.shipment.status).toBe('delivered');
    expect(body.items[0]?.events[0]).toMatchObject({
      carrierStatus: 'Livré',
      note: 'Appeler avant',
    });
    expect(OrderTrackingResponseSchema.parse(rival.json()).items).toEqual([]);
  });

  it('serves the public page without login and without carrier notes', async () => {
    await ingest.ingest(SOURCE, update(scan('Livré', 'delivered', 11), scan('???', null, 12)));

    const found = await app.inject({ method: 'GET', url: `/public/tracking/${CODE}` });
    const missing = await app.inject({ method: 'GET', url: '/public/tracking/nOpEnOpEnOpEnOpE' });

    const body = PublicTrackingResponseSchema.parse(found.json());
    expect(body).toMatchObject({
      status: 'delivered',
      events: [{ status: 'delivered', location: 'Oran' }],
    });
    expect(JSON.stringify(body)).not.toContain('Appeler');
    expect(missing.statusCode).toBe(404);
  });
});
