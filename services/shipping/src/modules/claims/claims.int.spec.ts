import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  ClaimLetterSchema,
  ClaimSchema,
  ListClaimCandidatesResponseSchema,
  ListClaimsResponseSchema,
} from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '77777777-7777-4777-8777-777777777777';
const OTHER = '88888888-8888-4888-8888-888888888888';
const MANAGER = 'b0000000-0000-4000-8000-000000000031';
const AGENT = 'b0000000-0000-4000-8000-000000000032';
const RIVAL = 'b0000000-0000-4000-8000-000000000033';
const DAY = 24 * 60 * 60 * 1000;
const shipmentId = (n: number) => `d0000000-0000-4000-8000-00000000000${n}`;

type Call = { method: 'GET' | 'POST' | 'PATCH'; url: string; payload?: object };

describe.skipIf(!baseUrl || !redisUrl)('carrier claims (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=shipping_claims_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let prisma: PrismaService;
  const auth: Record<string, Record<string, string>> = {};
  const call = (user: string, { method, url, payload }: Call) =>
    app.inject({ method, url, headers: auth[user] ?? {}, ...(payload ? { payload } : {}) });

  /** A parcel of the store whose last tracking event was `quietDays` ago. */
  const parcel = async (n: number, status: string, quietDays: number) => {
    await prisma.shipment.create({
      data: {
        id: shipmentId(n),
        storeId: STORE,
        orderId: `c0000000-0000-4000-8000-00000000000${n}`,
        carrier: 'yalidine',
        reference: `ORD-${n}`,
        trackingNumber: `TRK-${n}`,
        publicCode: `public-code-claims-${n}`,
        status,
        lastEventAt: new Date(Date.now() - quietDays * DAY),
        createdAt: new Date(Date.now() - (quietDays + 2) * DAY),
      },
    });
  };

  const damagedReturn = async (n: number) => {
    await prisma.returnBatch.create({
      data: {
        id: `f0000000-0000-4000-8000-00000000000${n}`,
        storeId: STORE,
        carrier: 'yalidine',
        receivedBy: MANAGER,
        receivedCount: 1,
        receipts: {
          create: {
            shipmentId: shipmentId(n),
            storeId: STORE,
            condition: 'damaged',
            unannounced: false,
            receivedAt: new Date(Date.now() - DAY),
          },
        },
      },
    });
  };

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({
      [MANAGER]: { [STORE]: 'manager' },
      [AGENT]: { [STORE]: 'agent' },
      [RIVAL]: { [OTHER]: 'owner' },
    });
    for (const [name, user, store] of [
      ['manager', MANAGER, STORE],
      ['agent', AGENT, STORE],
      ['rival', RIVAL, OTHER],
    ] as const) {
      auth[name] = {
        authorization: `Bearer ${await identity.tokenFor(user)}`,
        'x-store-id': store,
      };
    }
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.returnBatch.deleteMany();
    await prisma.shipment.deleteMany();
    await parcel(1, 'in_transit', 12);
    await parcel(2, 'in_transit', 2);
    await parcel(3, 'returned', 9);
    await parcel(4, 'returned', 9);
    await damagedReturn(4);
    await parcel(5, 'created', 30);
    await prisma.trackingEvent.create({
      data: {
        id: 'e0000000-0000-4000-8000-000000000001',
        shipmentId: shipmentId(1),
        storeId: STORE,
        status: 'in_transit',
        carrierStatus: 'En transit',
        location: 'Alger',
        at: new Date(Date.now() - 12 * DAY),
        dedupeKey: 'k1',
      },
    });
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  const open = (user: string, n: number, reason = 'stuck') =>
    call(user, {
      method: 'POST',
      url: '/claims',
      payload: { shipmentId: shipmentId(n), reason, declaredValue: 4300 },
    });

  it('finds stuck parcels, returns never received and damaged returns', async () => {
    const res = await call('manager', { method: 'GET', url: '/claims/candidates' });
    const rival = await call('rival', { method: 'GET', url: '/claims/candidates' });

    const items = ListClaimCandidatesResponseSchema.parse(res.json()).items;
    expect(items.map((i) => [i.trackingNumber, i.reason])).toEqual([
      ['TRK-1', 'stuck'],
      ['TRK-3', 'return_missing'],
      ['TRK-4', 'damaged'],
    ]);
    expect(ListClaimCandidatesResponseSchema.parse(rival.json()).items).toEqual([]);
  });

  it('opens one claim per parcel and drops it from the candidates', async () => {
    const first = await open('manager', 1);
    const again = await open('manager', 1, 'lost');
    const candidates = await call('manager', {
      method: 'GET',
      url: '/claims/candidates?stuckDays=3',
    });

    expect(first.statusCode).toBe(201);
    expect(ClaimSchema.parse(first.json())).toMatchObject({ state: 'open', declaredValue: 4300 });
    expect(again.json()).toMatchObject({ error: { code: 'claims.exists' } });
    const left = ListClaimCandidatesResponseSchema.parse(candidates.json()).items;
    expect(left.map((i) => i.trackingNumber)).toEqual(['TRK-3', 'TRK-4']);
  });

  it('refuses parcels the carrier never had, other stores and read-only roles', async () => {
    expect((await open('manager', 5)).json()).toMatchObject({
      error: { code: 'claims.not_handed_over' },
    });
    expect((await open('rival', 1)).statusCode).toBe(404);
    expect((await open('agent', 1)).statusCode).toBe(403);
  });

  it('follows a claim to a win with the amount recovered', async () => {
    const { id } = ClaimSchema.parse((await open('manager', 3, 'return_missing')).json());
    const patch = (payload: object) =>
      call('manager', { method: 'PATCH', url: `/claims/${id}`, payload });

    expect((await patch({ state: 'won' })).json()).toMatchObject({
      error: { code: 'claims.bad_transition' },
    });
    expect(
      ClaimSchema.parse((await patch({ state: 'submitted' })).json()).submittedAt,
    ).not.toBeNull();
    const won = ClaimSchema.parse((await patch({ state: 'won', recovered: 4000 })).json());
    expect(won).toMatchObject({ state: 'won', recovered: 4000 });
    expect(won.closedAt).not.toBeNull();

    const list = await call('manager', { method: 'GET', url: '/claims?state=won' });
    expect(ListClaimsResponseSchema.parse(list.json()).items.map((c) => c.id)).toEqual([id]);
  });

  it('writes the letter with the tracking timeline', async () => {
    const { id } = ClaimSchema.parse((await open('manager', 1)).json());
    const fr = await call('manager', { method: 'GET', url: `/claims/${id}/letter` });
    const ar = await call('manager', { method: 'GET', url: `/claims/${id}/letter?lang=ar` });
    const rival = await call('rival', { method: 'GET', url: `/claims/${id}/letter` });

    const letter = ClaimLetterSchema.parse(fr.json());
    expect(letter.subject).toContain('TRK-1');
    expect(letter.body).toContain('En transit (Alger)');
    expect(ClaimLetterSchema.parse(ar.json()).body).toContain('سجل التتبع:');
    expect(rival.statusCode).toBe(404);
  });
});
