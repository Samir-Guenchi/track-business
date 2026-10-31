import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  type EventEnvelope,
  MoneySummarySchema,
  SHIPMENT_EVENTS,
  TRACKING_EVENTS,
} from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { ParcelEventsUseCase } from './application/parcel-events.use-case.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '21212121-2121-4121-8121-212121212121';
const USERS = {
  accountant: 'c1000000-0000-4000-8000-000000000001',
  agent: 'c1000000-0000-4000-8000-000000000002',
} as const;
type User = keyof typeof USERS;

const envelope = (type: string, data: Record<string, unknown>): EventEnvelope => ({
  id: randomUUID(),
  type,
  occurredAt: new Date().toISOString(),
  storeId: STORE,
  correlationId: randomUUID(),
  data,
});
const created = (trackingNumber: string, codAmount: number) =>
  envelope(SHIPMENT_EVENTS.created, {
    shipmentId: randomUUID(),
    orderId: randomUUID(),
    reference: `ref-${trackingNumber}`,
    carrier: 'yalidine',
    trackingNumber,
    publicCode: 'pUbLiCcOdE_0123456789',
    labelUrl: null,
    codAmount,
  });
const moved = (trackingNumber: string, to: 'delivered' | 'returned' | 'in_transit') =>
  envelope(TRACKING_EVENTS.statusChanged, {
    shipmentId: randomUUID(),
    orderId: randomUUID(),
    carrier: 'yalidine',
    trackingNumber,
    from: 'out_for_delivery',
    to,
    failureReason: null,
    at: '2026-11-03T10:00:00.000Z',
  });

describe.skipIf(!baseUrl || !redisUrl)('parcel money (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=payments_money_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let prisma: PrismaService;
  let parcels: ParcelEventsUseCase;
  const headers: Partial<Record<User, Record<string, string>>> = {};

  const summary = async (user: User = 'accountant') =>
    app.inject({ method: 'GET', url: '/money/summary', headers: headers[user] ?? {} });

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({
      [USERS.accountant]: { [STORE]: 'accountant' },
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
    parcels = app.get(ParcelEventsUseCase);
    await prisma.$transaction([
      prisma.ledgerEntry.deleteMany(),
      prisma.parcel.deleteMany(),
      prisma.processedEvent.deleteMany(),
    ]);
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('owes the COD of delivered parcels only, once each', async () => {
    await parcels.shipmentCreated(created('yal-1', 3100));
    await parcels.shipmentCreated(created('yal-2', 2000));
    await parcels.shipmentCreated(created('yal-3', 1500));
    const delivered = moved('yal-1', 'delivered');

    expect(await parcels.statusChanged(delivered)).toBe(true);
    expect(await parcels.statusChanged(delivered)).toBe(false);
    expect(await parcels.statusChanged(moved('yal-2', 'in_transit'))).toBe(false);
    expect(await parcels.statusChanged(moved('yal-3', 'returned'))).toBe(true);

    const body = MoneySummarySchema.parse((await summary()).json());
    expect(body).toEqual({
      expected: 3100,
      received: 0,
      fees: 0,
      outstanding: 3100,
      flaggedParcels: 0,
    });
    const statuses = await prisma.parcel.findMany({ orderBy: { trackingNumber: 'asc' } });
    expect(statuses.map((p) => p.status)).toEqual([
      'awaiting_payout',
      'awaiting_delivery',
      'returned',
    ]);
  });

  it('ignores a second created event for the same parcel', async () => {
    expect(await parcels.shipmentCreated(created('yal-1', 9999))).toBe(false);

    const parcel = await prisma.parcel.findFirstOrThrow({ where: { trackingNumber: 'yal-1' } });
    expect(parcel.expectedCod).toBe(3100);
  });

  it('shows money to money.read only', async () => {
    expect((await summary('agent')).statusCode).toBe(403);
  });
});
