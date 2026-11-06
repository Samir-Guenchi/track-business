import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ATTEMPT_CHECK_EVENTS, type EventEnvelope, TRACKING_EVENTS } from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { DisputeFollowupUseCase } from './application/dispute-followup.use-case.js';
import { TrackFollowupsUseCase } from './application/track-followups.use-case.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '19519519-1951-4951-8951-195195195195';
const MANAGER = 'a0000000-0000-4000-8000-000000000195';
const SHIP_1 = 'b0000000-0000-4000-8000-000000000195';
const SHIP_2 = 'b0000000-0000-4000-8000-000000000196';

const newOrder = {
  customer: {
    name: 'Client Litige',
    phone: '0555 00 01 95',
    wilayaCode: 16,
    communeId: 1601,
    address: 'Rue C',
  },
  items: [{ name: 'Montre', quantity: 1, unitPrice: 4000 }],
  deliveryType: 'home',
  shippingFee: 500,
};

const envelope = (type: string, data: object): EventEnvelope => ({
  id: randomUUID(),
  type,
  occurredAt: '2026-11-05T09:00:00.000Z',
  storeId: STORE,
  correlationId: randomUUID(),
  data,
});

const failedAttempt = (orderId: string, shipmentId: string) =>
  envelope(TRACKING_EVENTS.statusChanged, {
    orderId,
    shipmentId,
    carrier: 'yalidine',
    trackingNumber: 'yal-D195',
    from: 'out_for_delivery',
    to: 'failed_attempt',
    failureReason: 'absent',
    at: '2026-11-05T09:00:00.000Z',
  });

const disputed = (orderId: string, shipmentId: string) =>
  envelope(ATTEMPT_CHECK_EVENTS.disputed, {
    shipmentId,
    orderId,
    carrier: 'yalidine',
    reason: 'absent',
    attemptAt: '2026-11-05T09:00:00.000Z',
  });

// Shares the orders API schema with the other integration files, which run one at a time.
describe.skipIf(!baseUrl || !redisUrl)('disputed failed attempts (real Postgres)', () => {
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let prisma: PrismaService;
  let track: TrackFollowupsUseCase;
  let dispute: DisputeFollowupUseCase;
  const orderWithFollowup = async (shipmentId: string) => {
    const created = await app.inject({
      method: 'POST',
      url: '/orders',
      payload: newOrder,
      headers: { authorization: `Bearer ${await identity.tokenFor(MANAGER)}`, 'x-store-id': STORE },
    });
    const { id } = created.json() as { id: string };
    await track.execute(failedAttempt(id, shipmentId));
    return id;
  };

  beforeAll(async () => {
    const databaseUrl = `${baseUrl}?schema=orders_api_test`;
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({ [MANAGER]: { [STORE]: 'manager' } });
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
    prisma = app.get(PrismaService);
    track = app.get(TrackFollowupsUseCase);
    dispute = app.get(DisputeFollowupUseCase);
    await prisma.deliveryFollowup.deleteMany({ where: { storeId: STORE } });
    await prisma.order.deleteMany({ where: { storeId: STORE } });
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('reopens a decided follow-up, records it in the order history and applies it once', async () => {
    const orderId = await orderWithFollowup(SHIP_1);
    await prisma.deliveryFollowup.updateMany({
      where: { storeId: STORE, shipmentId: SHIP_1 },
      data: { status: 'decided', decision: 'reattempt' },
    });
    const event = disputed(orderId, SHIP_1);

    expect(await dispute.execute(event)).toBe('reopened');
    expect(await dispute.execute(event)).toBe('duplicate');
    const followup = await prisma.deliveryFollowup.findFirstOrThrow({
      where: { storeId: STORE, shipmentId: SHIP_1 },
    });
    expect(followup).toMatchObject({ status: 'open', decision: 'reattempt' });
    expect(
      await prisma.auditEvent.count({
        where: { storeId: STORE, entityId: orderId, action: 'order.attempt_disputed' },
      }),
    ).toBe(1);
  });

  it('leaves closed follow-ups and unknown parcels alone', async () => {
    const orderId = await orderWithFollowup(SHIP_2);
    await prisma.deliveryFollowup.updateMany({
      where: { storeId: STORE, shipmentId: SHIP_2 },
      data: { status: 'closed', outcome: 'delivered' },
    });

    expect(await dispute.execute(disputed(orderId, SHIP_2))).toBe('ignored');
    expect(await dispute.execute(disputed(randomUUID(), randomUUID()))).toBe('ignored');
  });
});
