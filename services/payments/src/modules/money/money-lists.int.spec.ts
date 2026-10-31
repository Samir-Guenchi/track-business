import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  ListParcelMoneyResponseSchema,
  ListPayoutsResponseSchema,
  PAYMENT_EVENTS,
} from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { parcelEvents } from '../../test/parcel-events.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { MissingParcelSweep } from './application/missing-parcel-sweep.js';
import { ParcelEventsUseCase } from './application/parcel-events.use-case.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '25252525-2525-4525-8525-252525252525';
const OTHER_STORE = '26262626-2626-4626-8626-262626262626';
const USERS = {
  owner: 'c3000000-0000-4000-8000-000000000001',
  accountant: 'c3000000-0000-4000-8000-000000000002',
} as const;
type User = keyof typeof USERS;
const DAY = 24 * 60 * 60_000;

describe.skipIf(!baseUrl || !redisUrl)('money lists, settings and missing parcels', () => {
  const databaseUrl = `${baseUrl}?schema=payments_lists_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let prisma: PrismaService;
  const headers: Partial<Record<User, Record<string, string>>> = {};

  const call = (
    input: { method: 'GET' | 'PUT' | 'POST'; url: string; body?: object },
    user: User = 'owner',
  ) =>
    app.inject({
      method: input.method,
      url: input.url,
      headers: headers[user] ?? {},
      ...(input.body ? { payload: input.body } : {}),
    });

  const deliver = async (store: string, trackingNumber: string, daysAgo: number) => {
    const parcels = app.get(ParcelEventsUseCase);
    const { created, moved } = parcelEvents(store);
    await parcels.shipmentCreated(created(trackingNumber, 2500));
    await parcels.statusChanged(moved(trackingNumber, 'delivered'));
    await prisma.parcel.updateMany({
      where: { trackingNumber },
      data: { deliveredAt: new Date(Date.now() - daysAgo * DAY) },
    });
  };

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({
      [USERS.owner]: { [STORE]: 'owner' },
      [USERS.accountant]: { [STORE]: 'accountant' },
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
    await prisma.$transaction([
      prisma.ledgerEntry.deleteMany(),
      prisma.parcel.deleteMany(),
      prisma.payout.deleteMany(),
      prisma.moneySettings.deleteMany(),
      prisma.outboxEvent.deleteMany(),
      prisma.processedEvent.deleteMany(),
    ]);
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('starts at 14 days and lets money.manage change it', async () => {
    expect((await call({ method: 'GET', url: '/money/settings' }, 'accountant')).json()).toEqual({
      missingAfterDays: 14,
    });
    const put = (body: object, user: User = 'owner') =>
      call({ method: 'PUT', url: '/money/settings', body }, user);

    expect((await put({ missingAfterDays: 7 }, 'accountant')).statusCode).toBe(403);
    expect((await put({ missingAfterDays: 0 })).statusCode).toBe(400);
    expect((await put({ missingAfterDays: 7 })).json()).toEqual({ missingAfterDays: 7 });
  });

  it("flags parcels unpaid past each store's delay, once", async () => {
    await deliver(STORE, 'yal-old', 10);
    await deliver(STORE, 'yal-new', 1);
    await deliver(OTHER_STORE, 'yal-other', 10);
    const sweep = app.get(MissingParcelSweep);

    expect(await sweep.runOnce()).toBe(1);
    expect(await sweep.runOnce()).toBe(0);
    const missing = await prisma.parcel.findMany({ where: { status: 'missing' } });
    expect(missing.map((parcel) => parcel.trackingNumber)).toEqual(['yal-old']);
    const events = await prisma.outboxEvent.findMany({
      where: { type: PAYMENT_EVENTS.parcelFlagged },
    });
    expect(events).toHaveLength(1);
  });

  it('lists the claim list and pages through parcels', async () => {
    const missing = await call(
      { method: 'GET', url: '/money/parcels?status=missing' },
      'accountant',
    );
    expect(ListParcelMoneyResponseSchema.parse(missing.json()).items).toMatchObject([
      { trackingNumber: 'yal-old', status: 'missing', expectedCod: 2500 },
    ]);

    const first = ListParcelMoneyResponseSchema.parse(
      (await call({ method: 'GET', url: '/money/parcels?limit=1' })).json(),
    );
    expect(first.items).toHaveLength(1);
    const next = await call({
      method: 'GET',
      url: `/money/parcels?limit=5&cursor=${first.nextCursor}`,
    });
    expect(ListParcelMoneyResponseSchema.parse(next.json()).items).toHaveLength(1);
    expect((await call({ method: 'GET', url: '/money/parcels?cursor=nope' })).statusCode).toBe(400);
  });

  it('lists imported statements', async () => {
    const body = {
      carrier: 'yalidine',
      reference: 'PAY-1',
      paidAt: '2026-11-10',
      totalAmount: 2000,
      lines: [{ trackingNumber: 'yal-old', codAmount: 2500, shippingFee: 500, returnFee: 0 }],
    };
    expect((await call({ method: 'POST', url: '/payouts', body })).statusCode).toBe(202);

    const page = ListPayoutsResponseSchema.parse(
      (await call({ method: 'GET', url: '/payouts' }, 'accountant')).json(),
    );
    expect(page.items.map((payout) => payout.reference)).toEqual(['PAY-1']);
  });
});
