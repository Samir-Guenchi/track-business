import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { CarrierSuggestionSchema } from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '41414141-4141-4141-8141-414141414141';
const OTHERS = [
  '41000000-0000-4000-8000-000000000001',
  '41000000-0000-4000-8000-000000000002',
  '41000000-0000-4000-8000-000000000003',
];
const USERS = ['owner', 'packer', 'agent'] as const;
type User = (typeof USERS)[number];
const ROUTE = '/carriers/suggestion?originWilayaCode=16&wilayaCode=31&deliveryType=home';

describe.skipIf(!baseUrl || !redisUrl)('carrier suggestion (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=shipping_suggestion_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let prisma: PrismaService;
  const headers: Partial<Record<User, Record<string, string>>> = {};

  const call = (user: User, url: string, payload?: object) =>
    app.inject({
      method: payload ? 'PUT' : 'GET',
      url,
      headers: headers[user] ?? {},
      ...(payload ? { payload } : {}),
    });
  const suggestion = async (url = ROUTE) =>
    CarrierSuggestionSchema.parse((await call('packer', url)).json());

  const parcels = (storeId: string, carrier: string, statuses: Record<string, number>) =>
    Object.entries(statuses).flatMap(([status, count]) =>
      Array.from({ length: count }, () => {
        const id = randomUUID();
        return {
          id,
          storeId,
          orderId: randomUUID(),
          carrier,
          reference: id,
          trackingNumber: id,
          publicCode: id,
          status,
          toWilayaCode: 31,
          createdAt: new Date(Date.now() - 3 * 86_400_000),
          lastEventAt: new Date(),
        };
      }),
    );

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity(
      Object.fromEntries(USERS.map((user) => [user, { [STORE]: user }])),
    );
    for (const user of USERS) {
      headers[user] = {
        authorization: `Bearer ${await identity.tokenFor(user)}`,
        'x-store-id': STORE,
      };
    }
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
    prisma = app.get(PrismaService);
    await prisma.$transaction([
      prisma.trackingEvent.deleteMany(),
      prisma.shipment.deleteMany(),
      prisma.rateCard.deleteMany(),
      prisma.carrierAccount.deleteMany(),
      prisma.carrierSuggestionSettings.deleteMany(),
    ]);
    const account = {
      kekId: 'v1',
      wrappedKey: Buffer.alloc(1),
      secret: Buffer.alloc(1),
      hint: '…',
      verifiedAt: new Date(),
    };
    await prisma.carrierAccount.createMany({
      data: ['yalidine', 'zr-express'].map((carrier) => ({ storeId: STORE, carrier, ...account })),
    });
    const route = {
      storeId: STORE,
      fromWilaya: 16,
      toWilaya: 31,
      deliveryType: 'home',
      returnFee: 200,
      importedAt: new Date(),
    };
    await prisma.rateCard.createMany({
      data: [
        { ...route, carrier: 'yalidine', price: 600 },
        { ...route, carrier: 'zr-express', price: 500 },
      ],
    });
    await prisma.shipment.createMany({
      data: [
        ...parcels(STORE, 'yalidine', { delivered: 9, returned: 1 }),
        ...parcels(STORE, 'zr-express', { delivered: 2, returned: 8, in_transit: 5 }),
        ...OTHERS.flatMap((store) => parcels(store, 'yalidine', { delivered: 7 })),
      ],
    });
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('suggests the reliable carrier over the cheaper one by default', async () => {
    const body = await suggestion();

    expect(body).toMatchObject({ suggested: 'yalidine', reason: 'most_reliable' });
    expect(body.options).toMatchObject([
      {
        carrier: 'yalidine',
        cost: 600,
        storeDeliveryRate: 0.9,
        storeParcels: 10,
        averageDeliveryDays: 3,
      },
      { carrier: 'zr-express', cost: 500, storeDeliveryRate: 0.2, storeParcels: 10 },
    ]);
  });

  it('shows network rates only where several stores shipped', async () => {
    const [yalidine, zr] = (await suggestion()).options;

    expect(yalidine?.networkDeliveryRate).toBeCloseTo(30 / 31);
    expect(zr?.networkDeliveryRate).toBeNull();
  });

  it('follows the store weights and routing rules', async () => {
    const cheap = { weights: { price: 10, reliability: 0, speed: 0 } };
    expect((await call('packer', '/carriers/suggestion-settings', cheap)).statusCode).toBe(403);
    expect((await call('owner', '/carriers/suggestion-settings', cheap)).statusCode).toBe(200);
    expect(await suggestion()).toMatchObject({ suggested: 'zr-express', reason: 'cheapest' });

    const rules = { rules: [{ wilayaCodes: [31], carrier: 'yalidine' }] };
    await call('owner', '/carriers/suggestion-settings', { ...cheap, ...rules });
    expect(await suggestion()).toMatchObject({ suggested: 'yalidine', reason: 'routing_rule' });
    expect((await call('packer', '/carriers/suggestion-settings')).json()).toMatchObject(rules);
  });

  it('suggests nothing without a rate for the route', async () => {
    const body = await suggestion(ROUTE.replace('home', 'stopdesk'));

    expect(body.suggested).toBeNull();
    expect(body.options.map((option) => option.unavailable)).toEqual(['no_rate', 'no_rate']);
  });

  it('is for people who ship parcels', async () => {
    expect((await call('agent', ROUTE)).statusCode).toBe(403);
  });
});
