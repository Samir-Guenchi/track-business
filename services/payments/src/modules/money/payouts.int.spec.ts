import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { MoneySummarySchema, PAYMENT_EVENTS, PayoutSchema } from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { parcelEvents } from '../../test/parcel-events.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { ParcelEventsUseCase } from './application/parcel-events.use-case.js';
import { PayoutMatcher } from './application/payout-matcher.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '23232323-2323-4323-8323-232323232323';
const USERS = {
  owner: 'c2000000-0000-4000-8000-000000000001',
  accountant: 'c2000000-0000-4000-8000-000000000002',
} as const;
type User = keyof typeof USERS;
const { created, moved } = parcelEvents(STORE);

type Fees = Partial<Record<'shippingFee' | 'returnFee', number>>;
const line = (trackingNumber: string, codAmount: number, fees: Fees = { shippingFee: 500 }) => ({
  trackingNumber,
  codAmount,
  shippingFee: 0,
  returnFee: 0,
  ...fees,
});
const statement = {
  carrier: 'yalidine',
  reference: 'PAY-2026-45',
  paidAt: '2026-11-10',
  totalAmount: 4200,
  lines: [
    line('yal-1', 3100),
    line('yal-2', 1800),
    line('yal-3', 0, { shippingFee: 0, returnFee: 200 }),
    line('yal-404', 500, { shippingFee: 0 }),
  ],
};

describe.skipIf(!baseUrl || !redisUrl)('payout import and matching (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=payments_payouts_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let prisma: PrismaService;
  const headers: Partial<Record<User, Record<string, string>>> = {};
  let payoutId = '';

  const post = (body: object, user: User = 'owner') =>
    app.inject({ method: 'POST', url: '/payouts', headers: headers[user] ?? {}, payload: body });
  const get = (url: string) =>
    app.inject({ method: 'GET', url, headers: headers.accountant ?? {} });

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
      prisma.outboxEvent.deleteMany(),
      prisma.processedEvent.deleteMany(),
    ]);
    const parcels = app.get(ParcelEventsUseCase);
    for (const [tracking, cod] of [
      ['yal-1', 3100],
      ['yal-2', 2000],
      ['yal-3', 1500],
    ] as const) {
      await parcels.shipmentCreated(created(tracking, cod));
    }
    await parcels.statusChanged(moved('yal-1', 'delivered'));
    await parcels.statusChanged(moved('yal-2', 'delivered'));
    await parcels.statusChanged(moved('yal-3', 'returned'));
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('stores a statement for matching and answers 202', async () => {
    const response = await post(statement);

    expect(response.statusCode).toBe(202);
    const payout = PayoutSchema.parse(response.json());
    expect(payout).toMatchObject({ status: 'processing', codAmount: 5400, fees: 1200, lines: 4 });
    expect(payout.transferGap).toBe(0);
    payoutId = payout.id;
  });

  it('refuses the same statement twice, repeated lines and readers', async () => {
    expect((await post(statement)).statusCode).toBe(409);
    const repeated = { ...statement, reference: 'R2', lines: [line('a', 1), line('a', 1)] };
    expect((await post(repeated)).statusCode).toBe(400);
    expect((await post({ ...statement, reference: 'R3' }, 'accountant')).statusCode).toBe(403);
  });

  it('matches every line in the background and balances the ledger', async () => {
    const matcher = app.get(PayoutMatcher);
    expect(await matcher.runOnce()).toBe(1);
    expect(await matcher.runOnce()).toBe(0);

    const payout = PayoutSchema.parse((await get(`/payouts/${payoutId}`)).json());
    expect(payout).toMatchObject({ status: 'reconciled', matched: 2, flagged: 2 });
    const parcels = await prisma.parcel.findMany({ orderBy: { trackingNumber: 'asc' } });
    expect(parcels.map((p) => [p.trackingNumber, p.status])).toEqual([
      ['yal-1', 'matched'],
      ['yal-2', 'amount_mismatch'],
      ['yal-3', 'returned'],
      ['yal-404', 'unknown_line'],
    ]);
    const summary = MoneySummarySchema.parse((await get('/money/summary')).json());
    expect(summary).toEqual({
      expected: 5100,
      received: 4200,
      fees: 1200,
      outstanding: 200,
      flaggedParcels: 2,
    });
    const total = await prisma.ledgerEntry.aggregate({ _sum: { amount: true } });
    expect(total._sum.amount).toBe(0);
  });

  it('announces the import and each parcel to claim', async () => {
    const events = await prisma.outboxEvent.findMany();
    const types = events.map((event) => event.type).sort();

    expect(types).toEqual([
      PAYMENT_EVENTS.parcelFlagged,
      PAYMENT_EVENTS.parcelFlagged,
      PAYMENT_EVENTS.payoutImported,
    ]);
  });

  it('answers 404 for a statement the store does not have', async () => {
    expect((await get('/payouts/00000000-0000-4000-8000-000000000000')).statusCode).toBe(404);
  });
});
