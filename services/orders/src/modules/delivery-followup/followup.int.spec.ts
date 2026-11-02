import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  type EventEnvelope,
  FOLLOWUP_EVENTS,
  type ShipmentStatusChangedEvent,
  TRACKING_EVENTS,
} from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { TrackFollowupsUseCase } from './application/track-followups.use-case.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '13213213-1321-4321-8321-132132132132';
const MANAGER = 'a0000000-0000-4000-8000-000000000132';
const AGENT = 'a0000000-0000-4000-8000-000000000133';

const newOrder = {
  customer: {
    name: 'Client Suivi',
    phone: '0555 00 01 32',
    wilayaCode: 31,
    communeId: 3101,
    address: 'Rue B',
  },
  items: [{ name: 'Sac', quantity: 1, unitPrice: 3000 }],
  deliveryType: 'home',
  shippingFee: 500,
};

type Change = Pick<ShipmentStatusChangedEvent, 'shipmentId' | 'to' | 'at'> &
  Partial<ShipmentStatusChangedEvent>;
const scan = (orderId: string, change: Change): EventEnvelope => ({
  id: randomUUID(),
  type: TRACKING_EVENTS.statusChanged,
  occurredAt: change.at,
  storeId: STORE,
  correlationId: randomUUID(),
  data: {
    orderId,
    carrier: 'yalidine',
    trackingNumber: 'yal-F132',
    from: 'out_for_delivery',
    failureReason: null,
    ...change,
  },
});

// Shares the orders API schema: pg_trgm lives there, and files run one at a time.
describe.skipIf(!baseUrl || !redisUrl)('failed-delivery follow-up (real Postgres)', () => {
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let track: TrackFollowupsUseCase;
  const call = async (
    user: string,
    request: { method: 'GET' | 'POST'; url: string; payload?: object },
  ) =>
    app.inject({
      ...request,
      headers: { authorization: `Bearer ${await identity.tokenFor(user)}`, 'x-store-id': STORE },
    });
  const newShippedOrder = async () => {
    const { id } = (
      await call(MANAGER, { method: 'POST', url: '/orders', payload: newOrder })
    ).json() as { id: string };
    return id;
  };

  beforeAll(async () => {
    const databaseUrl = `${baseUrl}?schema=orders_api_test`;
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({
      [MANAGER]: { [STORE]: 'manager' },
      [AGENT]: { [STORE]: 'agent' },
    });
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
    track = app.get(TrackFollowupsUseCase);
    const prisma = app.get(PrismaService);
    await prisma.deliveryFollowup.deleteMany({ where: { storeId: STORE } });
    await prisma.order.deleteMany({ where: { storeId: STORE } });
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('opens one item per parcel, counts attempts and applies an event once', async () => {
    const orderId = await newShippedOrder();
    const first = scan(orderId, {
      shipmentId: 'sh-1',
      to: 'failed_attempt',
      failureReason: 'absent',
      at: '2026-11-02T09:00:00.000Z',
    });

    expect(await track.execute(first)).toBe('opened');
    // A redelivered scan is no newer than the stored attempt: nothing changes.
    expect(await track.execute(first)).toBe('ignored');
    expect(
      await track.execute(
        scan(orderId, {
          shipmentId: 'sh-1',
          to: 'failed_attempt',
          failureReason: 'phone_off',
          at: '2026-11-03T09:00:00.000Z',
        }),
      ),
    ).toBe('updated');

    const list = (
      await call(AGENT, { method: 'GET', url: '/orders/followups?status=open' })
    ).json() as {
      items: { orderRef: string; attempts: number; reason: string; customerName: string }[];
    };
    expect(list.items).toHaveLength(1);
    expect(list.items[0]).toMatchObject({
      attempts: 2,
      reason: 'phone_off',
      customerName: 'Client Suivi',
    });
  });

  it('lets an agent decide, audits it and tells shipping', async () => {
    const list = (await call(AGENT, { method: 'GET', url: '/orders/followups' })).json() as {
      items: { id: string; orderId: string }[];
    };
    const [item] = list.items;
    if (!item) throw new Error('no follow-up');

    const missingDesk = await call(AGENT, {
      method: 'POST',
      url: `/orders/followups/${item.id}/decision`,
      payload: {
        decision: 'switch_to_stopdesk',
      },
    });
    const decided = await call(AGENT, {
      method: 'POST',
      url: `/orders/followups/${item.id}/decision`,
      payload: {
        decision: 'switch_to_stopdesk',
        stopDeskId: 'sd-31',
      },
    });

    expect(missingDesk.statusCode).toBe(400);
    expect(decided.json()).toMatchObject({
      status: 'decided',
      decision: 'switch_to_stopdesk',
      stopDeskId: 'sd-31',
    });
    const prisma = app.get(PrismaService);
    const outbox = await prisma.outboxEvent.findFirstOrThrow({
      where: { storeId: STORE, type: FOLLOWUP_EVENTS.decided },
    });
    expect(JSON.stringify(outbox.payload)).toContain('sd-31');
    expect(
      await prisma.auditEvent.count({
        where: { entityId: item.orderId, action: 'order.followup_decided' },
      }),
    ).toBe(1);
  });

  it('closes on delivery, refuses later decisions and counts the recovery', async () => {
    const list = (await call(AGENT, { method: 'GET', url: '/orders/followups' })).json() as {
      items: { id: string; orderId: string }[];
    };
    const [item] = list.items;
    if (!item) throw new Error('no follow-up');

    await track.execute(
      scan(item.orderId, { shipmentId: 'sh-1', to: 'delivered', at: '2026-11-04T09:00:00.000Z' }),
    );

    const late = await call(AGENT, {
      method: 'POST',
      url: `/orders/followups/${item.id}/decision`,
      payload: {
        decision: 'return',
      },
    });
    const metrics = (
      await call(AGENT, { method: 'GET', url: '/orders/followups/metrics' })
    ).json() as {
      items: unknown[];
    };
    expect(late.statusCode).toBe(409);
    expect(metrics.items).toEqual([
      {
        carrier: 'yalidine',
        reason: 'phone_off',
        failed: 1,
        recovered: 1,
        returned: 0,
        recoveryRate: 1,
      },
    ]);
  });

  it('ignores parcels of unknown orders and statuses that change nothing', async () => {
    expect(
      await track.execute(
        scan(randomUUID(), {
          shipmentId: 'sh-x',
          to: 'failed_attempt',
          at: '2026-11-02T09:00:00.000Z',
        }),
      ),
    ).toBe('ignored');
    expect(
      await track.execute(
        scan(randomUUID(), {
          shipmentId: 'sh-y',
          to: 'in_transit',
          at: '2026-11-02T09:00:00.000Z',
        }),
      ),
    ).toBe('ignored');
  });
});
