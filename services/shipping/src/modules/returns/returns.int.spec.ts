import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  ListExpectedReturnsResponseSchema,
  ListReturnBatchesResponseSchema,
  RETURN_EVENTS,
  ReturnBatchSchema,
  ReturnSummaryResponseSchema,
} from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '77777777-7777-4777-8777-777777777777';
const OTHER = '88888888-8888-4888-8888-888888888888';
const PACKER = 'b0000000-0000-4000-8000-000000000021';
const AGENT = 'b0000000-0000-4000-8000-000000000022';
const RIVAL = 'b0000000-0000-4000-8000-000000000023';
const DAY = 24 * 60 * 60 * 1000;

type Call = { method: 'GET' | 'POST'; url: string; payload?: object };

describe.skipIf(!baseUrl || !redisUrl)('return-to-seller chain (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=shipping_returns_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let prisma: PrismaService;
  const auth: Record<string, Record<string, string>> = {};
  const call = (user: string, { method, url, payload }: Call) =>
    app.inject({ method, url, headers: auth[user] ?? {}, ...(payload ? { payload } : {}) });

  /** A parcel of the store, announced as returning `daysAgo` days ago (null: still in transit). */
  const parcel = async (n: number, daysAgo: number | null, carrier = 'yalidine') => {
    const id = `d0000000-0000-4000-8000-00000000000${n}`;
    const status = daysAgo === null ? 'in_transit' : 'returned';
    await prisma.shipment.create({
      data: {
        id,
        storeId: STORE,
        orderId: `c0000000-0000-4000-8000-00000000000${n}`,
        carrier,
        reference: `ORD-${n}`,
        trackingNumber: `TRK-${n}`,
        publicCode: `public-code-returns-${n}`,
        status,
        createdAt: new Date(Date.UTC(2026, 9, n)),
      },
    });
    if (daysAgo === null) return;
    await prisma.trackingEvent.create({
      data: {
        id: `e0000000-0000-4000-8000-00000000000${n}`,
        shipmentId: id,
        storeId: STORE,
        status: 'returning',
        carrierStatus: 'Retour en cours',
        at: new Date(Date.now() - daysAgo * DAY),
        dedupeKey: `k${n}`,
      },
    });
  };

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({
      [PACKER]: { [STORE]: 'packer' },
      [AGENT]: { [STORE]: 'agent' },
      [RIVAL]: { [OTHER]: 'owner' },
    });
    for (const [name, user, store] of [
      ['packer', PACKER, STORE],
      ['agent', AGENT, STORE],
      ['rival', RIVAL, OTHER],
    ] as const) {
      const token = await identity.tokenFor(user);
      auth[name] = { authorization: `Bearer ${token}`, 'x-store-id': store };
    }
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.outboxEvent.deleteMany();
    await prisma.returnBatch.deleteMany();
    await prisma.shipment.deleteMany();
    await parcel(1, 15);
    await parcel(2, 3);
    await parcel(3, 20, 'zr-express');
    await parcel(4, null);
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('lists returns not received yet, oldest first, with the overdue ones flagged', async () => {
    const all = await call('packer', { method: 'GET', url: '/returns/expected' });
    const late = await call('packer', {
      method: 'GET',
      url: '/returns/expected?overdue=true&carrier=yalidine',
    });
    const rival = await call('rival', { method: 'GET', url: '/returns/expected' });

    const items = ListExpectedReturnsResponseSchema.parse(all.json()).items;
    expect(items.map((i) => [i.trackingNumber, i.overdue])).toEqual([
      ['TRK-1', true],
      ['TRK-2', false],
      ['TRK-3', true],
    ]);
    expect(items[0]?.daysWaiting).toBe(15);
    const lateItems = ListExpectedReturnsResponseSchema.parse(late.json()).items;
    expect(lateItems.map((i) => i.trackingNumber)).toEqual(['TRK-1']);
    expect(ListExpectedReturnsResponseSchema.parse(rival.json()).items).toEqual([]);
  });

  it("expects a delivered exchange's old items back (#138)", async () => {
    await prisma.shipment.update({
      where: { id: 'd0000000-0000-4000-8000-000000000004' },
      data: { status: 'delivered', exchangeCollect: '1 x Robe - M', lastEventAt: new Date() },
    });
    const all = await call('packer', { method: 'GET', url: '/returns/expected' });
    const items = ListExpectedReturnsResponseSchema.parse(all.json()).items;
    expect(items.map((i) => i.trackingNumber)).toContain('TRK-4');
  });

  it('pages the expected list with a cursor', async () => {
    const first = await call('packer', { method: 'GET', url: '/returns/expected?limit=2' });
    const page = ListExpectedReturnsResponseSchema.parse(first.json());
    const url = `/returns/expected?limit=2&cursor=${page.nextCursor ?? ''}`;
    const second = ListExpectedReturnsResponseSchema.parse(
      (await call('packer', { method: 'GET', url })).json(),
    );

    expect(page.items).toHaveLength(2);
    expect(second.items.map((i) => i.trackingNumber)).toEqual(['TRK-3']);
    expect(second.nextCursor).toBeNull();
  });

  it('receives a hand-over and keeps what did not match as proof', async () => {
    const payload = {
      carrier: 'yalidine',
      courierName: 'Courier Test',
      scanned: [
        { trackingNumber: 'TRK-1', condition: 'damaged' },
        { trackingNumber: 'TRK-4' },
        { trackingNumber: 'NOPE-1' },
      ],
      declared: ['TRK-1', 'TRK-2'],
    };
    const res = await call('packer', { method: 'POST', url: '/returns/batches', payload });

    expect(res.statusCode).toBe(201);
    const batch = ReturnBatchSchema.parse(res.json());
    expect(batch.received.map((r) => [r.trackingNumber, r.condition, r.unannounced])).toEqual([
      ['TRK-1', 'damaged', false],
      ['TRK-4', 'intact', true],
    ]);
    expect(batch).toMatchObject({ unknown: ['NOPE-1'], missing: ['TRK-2'], receivedBy: PACKER });
    const events = await prisma.outboxEvent.findMany();
    expect(events.map((e) => e.type)).toEqual([RETURN_EVENTS.received, RETURN_EVENTS.received]);

    const expected = await call('packer', {
      method: 'GET',
      url: '/returns/expected?carrier=yalidine',
    });
    const left = ListExpectedReturnsResponseSchema.parse(expected.json()).items;
    expect(left.map((i) => i.trackingNumber)).toEqual(['TRK-2']);

    const again = await call('packer', {
      method: 'POST',
      url: '/returns/batches',
      payload: { carrier: 'yalidine', scanned: [{ trackingNumber: 'TRK-1' }] },
    });
    expect(ReturnBatchSchema.parse(again.json())).toMatchObject({
      received: [],
      alreadyReceived: ['TRK-1'],
    });
  });

  it('serves past batches to their store only', async () => {
    const created = await call('packer', {
      method: 'POST',
      url: '/returns/batches',
      payload: { carrier: 'zr-express', scanned: [{ trackingNumber: 'TRK-3' }] },
    });
    const { id } = ReturnBatchSchema.parse(created.json());

    const list = await call('packer', { method: 'GET', url: '/returns/batches' });
    const one = await call('packer', { method: 'GET', url: `/returns/batches/${id}` });
    const rival = await call('rival', { method: 'GET', url: `/returns/batches/${id}` });

    const items = ListReturnBatchesResponseSchema.parse(list.json()).items;
    expect(items.map((b) => [b.id, b.receivedCount])).toEqual([[id, 1]]);
    expect(ReturnBatchSchema.parse(one.json()).received[0]?.trackingNumber).toBe('TRK-3');
    expect(rival.statusCode).toBe(404);
  });

  it('counts expected and overdue returns per carrier', async () => {
    const res = await call('agent', { method: 'GET', url: '/returns/summary?overdueDays=10' });

    const body = ReturnSummaryResponseSchema.parse(res.json());
    const byCarrier = Object.fromEntries(body.carriers.map((c) => [c.carrier, c]));
    expect(byCarrier['yalidine']).toMatchObject({ expected: 2, overdue: 1 });
    expect(byCarrier['zr-express']).toMatchObject({ expected: 1, overdue: 1 });
  });

  it('lets only roles that handle parcels receive returns', async () => {
    const res = await call('agent', {
      method: 'POST',
      url: '/returns/batches',
      payload: { carrier: 'yalidine', scanned: [{ trackingNumber: 'TRK-1' }] },
    });

    expect(res.statusCode).toBe(403);
  });
});
