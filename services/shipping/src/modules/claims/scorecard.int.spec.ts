import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ScorecardResponseSchema } from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '77777777-7777-4777-8777-777777777777';
const OTHER = '88888888-8888-4888-8888-888888888888';
const AGENT = 'b0000000-0000-4000-8000-000000000041';
const RIVAL = 'b0000000-0000-4000-8000-000000000042';
const DAY = 24 * 60 * 60 * 1000;

interface Parcel {
  readonly n: number;
  readonly carrier: string;
  readonly wilaya: number;
  readonly status: string;
  readonly daysAgo?: number;
}

describe.skipIf(!baseUrl || !redisUrl)('carrier scorecard (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=shipping_scorecard_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let prisma: PrismaService;
  const headers: Record<string, Record<string, string>> = {};
  const get = (user: string, url: string) =>
    app.inject({ method: 'GET', url, headers: headers[user] ?? {} });

  const parcel = async ({ n, carrier, wilaya, status, daysAgo = 5 }: Parcel) => {
    const createdAt = new Date(Date.now() - daysAgo * DAY);
    await prisma.shipment.create({
      data: {
        id: `d0000000-0000-4000-8000-0000000000${String(n).padStart(2, '0')}`,
        storeId: STORE,
        orderId: `c0000000-0000-4000-8000-0000000000${String(n).padStart(2, '0')}`,
        carrier,
        reference: `ORD-${n}`,
        trackingNumber: `TRK-${n}`,
        publicCode: `public-code-score-${n}`,
        toWilayaCode: wilaya,
        status,
        createdAt,
        lastEventAt: new Date(createdAt.getTime() + 2 * DAY),
      },
    });
  };

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({
      [AGENT]: { [STORE]: 'agent' },
      [RIVAL]: { [OTHER]: 'owner' },
    });
    headers['agent'] = {
      authorization: `Bearer ${await identity.tokenFor(AGENT)}`,
      'x-store-id': STORE,
    };
    headers['rival'] = {
      authorization: `Bearer ${await identity.tokenFor(RIVAL)}`,
      'x-store-id': OTHER,
    };
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
    prisma = app.get(PrismaService);
    await prisma.shipment.deleteMany();
    const parcels: Parcel[] = [
      { n: 1, carrier: 'yalidine', wilaya: 16, status: 'delivered' },
      { n: 2, carrier: 'yalidine', wilaya: 16, status: 'returned' },
      { n: 3, carrier: 'zr-express', wilaya: 16, status: 'delivered' },
      { n: 4, carrier: 'yalidine', wilaya: 31, status: 'delivered' },
      { n: 5, carrier: 'yalidine', wilaya: 31, status: 'delivered', daysAgo: 200 },
      { n: 6, carrier: 'zr-express', wilaya: 16, status: 'cancelled' },
    ];
    for (const p of parcels) await parcel(p);
    await prisma.claim.create({
      data: {
        id: 'a0000000-0000-4000-8000-000000000001',
        storeId: STORE,
        shipmentId: 'd0000000-0000-4000-8000-000000000002',
        reason: 'return_missing',
        state: 'won',
        declaredValue: 4300,
        recovered: 4000,
        createdBy: AGENT,
      },
    });
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('ranks carriers store-wide and per wilaya, over the chosen window', async () => {
    const res = await get('agent', '/carrier-scorecard');
    const card = ScorecardResponseSchema.parse(res.json());

    expect(card.carriers.map((c) => [c.carrier, c.parcels, c.deliveryRate])).toEqual([
      ['zr-express', 1, 1],
      ['yalidine', 3, 0.667],
    ]);
    expect(card.carriers[1]).toMatchObject({
      avgDeliveryDays: 2,
      lost: 1,
      claimsWon: 1,
      recovered: 4000,
    });
    expect(card.byWilaya.map((c) => `${c.wilayaCode}:${c.carrier}`)).toEqual([
      '16:zr-express',
      '16:yalidine',
      '31:yalidine',
    ]);
    const year = ScorecardResponseSchema.parse(
      (await get('agent', '/carrier-scorecard?days=365')).json(),
    );
    expect(year.byWilaya.find((c) => c.wilayaCode === 31)?.parcels).toBe(2);
  });

  it('shows another store nothing and refuses a window under a month', async () => {
    const rival = ScorecardResponseSchema.parse((await get('rival', '/carrier-scorecard')).json());
    expect(rival.carriers).toEqual([]);
    expect((await get('agent', '/carrier-scorecard?days=7')).statusCode).toBe(400);
  });
});
