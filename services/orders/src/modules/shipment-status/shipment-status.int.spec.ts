import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  type EventEnvelope,
  ORDER_EVENTS,
  type ShipmentStatusChangedEvent,
  TRACKING_EVENTS,
} from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { ApplyShipmentStatusUseCase } from './application/apply-shipment-status.use-case.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '45454545-4545-4545-8545-454545454545';
const MANAGER = 'a0000000-0000-4000-8000-000000000045';

const newOrder = {
  customer: {
    name: 'Client Test',
    phone: '0555 00 00 04',
    wilayaCode: 16,
    communeId: 1621,
    address: 'Rue A',
  },
  items: [{ name: 'Robe', quantity: 1, unitPrice: 2500 }],
  deliveryType: 'home',
  shippingFee: 600,
};

const statusEvent = (
  orderId: string,
  change: Pick<ShipmentStatusChangedEvent, 'from' | 'to'> & Partial<ShipmentStatusChangedEvent>,
): EventEnvelope => ({
  id: randomUUID(),
  type: TRACKING_EVENTS.statusChanged,
  occurredAt: '2026-11-01T10:00:00.000Z',
  storeId: STORE,
  correlationId: randomUUID(),
  data: {
    shipmentId: randomUUID(),
    orderId,
    carrier: 'yalidine',
    trackingNumber: 'yal-TEST',
    failureReason: null,
    at: '2026-11-01T09:00:00.000Z',
    ...change,
  },
});

// Shares the orders API schema: pg_trgm lives there, and files run one at a time.
describe.skipIf(!baseUrl || !redisUrl)('orders follow their parcels (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=orders_api_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let prisma: PrismaService;
  let apply: ApplyShipmentStatusUseCase;

  const shippedOrder = async (): Promise<string> => {
    const response = await app.inject({
      method: 'POST',
      url: '/orders',
      headers: { authorization: `Bearer ${await identity.tokenFor(MANAGER)}`, 'x-store-id': STORE },
      payload: newOrder,
    });
    const { id } = response.json() as { id: string };
    await prisma.order.update({ where: { id }, data: { status: 'shipped' } });
    return id;
  };
  const statusOf = async (id: string) =>
    (await prisma.order.findUniqueOrThrow({ where: { id } })).status;

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({ [MANAGER]: { [STORE]: 'manager' } });
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
    prisma = app.get(PrismaService);
    apply = app.get(ApplyShipmentStatusUseCase);
    await prisma.order.deleteMany({ where: { storeId: STORE } });
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('moves the order, audits it as a system change and emits the order event', async () => {
    const id = await shippedOrder();

    const result = await apply.execute(statusEvent(id, { from: 'created', to: 'picked_up' }));

    expect(result).toBe('applied');
    expect(await statusOf(id)).toBe('in_transit');
    const audit = await prisma.auditEvent.findFirstOrThrow({
      where: { entityId: id, action: 'order.status_changed' },
    });
    expect(audit).toMatchObject({ actorType: 'system', actorId: 'shipping' });
    const outbox = await prisma.outboxEvent.findMany({
      where: { type: ORDER_EVENTS.statusChanged, storeId: STORE },
    });
    expect(
      outbox.map((row) => (row.payload as { data: { orderId: string } }).data.orderId),
    ).toContain(id);
  });

  it('applies a redelivered event only once', async () => {
    const id = await shippedOrder();
    const event = statusEvent(id, { from: 'in_transit', to: 'out_for_delivery' });

    expect(await apply.execute(event)).toBe('applied');
    await prisma.order.update({ where: { id }, data: { status: 'shipped' } });

    expect(await apply.execute(event)).toBe('duplicate');
    expect(await statusOf(id)).toBe('shipped');
  });

  it('keeps the failure reason of a failed attempt', async () => {
    const id = await shippedOrder();
    await apply.execute(statusEvent(id, { from: 'in_transit', to: 'out_for_delivery' }));

    await apply.execute(
      statusEvent(id, {
        from: 'out_for_delivery',
        to: 'failed_attempt',
        failureReason: 'phone_off',
      }),
    );

    expect(await statusOf(id)).toBe('failed_attempt');
    const audit = await prisma.auditEvent.findFirstOrThrow({
      where: { entityId: id, action: 'order.status_changed' },
      orderBy: { occurredAt: 'desc' },
    });
    expect(JSON.stringify(audit.changes)).toContain('yalidine: phone_off');
  });

  it('ignores scans that do not fit the order (cancelled parcel, delivered order, unknown order)', async () => {
    const id = await shippedOrder();
    await prisma.order.update({ where: { id }, data: { status: 'delivered' } });

    expect(await apply.execute(statusEvent(id, { from: 'in_transit', to: 'returning' }))).toBe(
      'ignored',
    );
    expect(await apply.execute(statusEvent(id, { from: 'created', to: 'cancelled' }))).toBe(
      'ignored',
    );
    expect(
      await apply.execute(statusEvent(randomUUID(), { from: 'created', to: 'picked_up' })),
    ).toBe('ignored');
    expect(await statusOf(id)).toBe('delivered');
  });
});
