import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { StorePricesResponseSchema } from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { seedGeo } from '../geo/infrastructure/seed/seed-geo.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '11111111-1111-4111-8111-111111111111';
const OTHER_STORE = '22222222-2222-4222-8222-222222222222';
const USERS = { owner: STORE, agent: STORE, outsider: OTHER_STORE } as const;

describe.skipIf(!baseUrl || !redisUrl)('pricing API (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=shipping_pricing_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  const headers: Record<string, Record<string, string>> = {};

  type Method = 'GET' | 'PUT';
  const call = (user: keyof typeof USERS, request: `${Method} ${string}`, payload?: object) => {
    const [method, url] = request.split(' ') as [Method, string];
    return app.inject({
      method,
      url,
      headers: headers[user] ?? {},
      ...(payload ? { payload } : {}),
    });
  };

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({
      owner: { [STORE]: 'owner' },
      agent: { [STORE]: 'agent' },
      outsider: { [OTHER_STORE]: 'owner' },
    });
    for (const [user, store] of Object.entries(USERS)) {
      headers[user] = {
        authorization: `Bearer ${await identity.tokenFor(user)}`,
        'x-store-id': store,
      };
    }
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
    const prisma = app.get(PrismaService);
    await seedGeo(prisma, [], 'test');
    await prisma.$transaction([
      prisma.storePrice.deleteMany(),
      prisma.storeShippingSettings.deleteMany(),
      prisma.rateCard.deleteMany(),
    ]);
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('shows all 69 wilayas x 2 delivery types to a new store', async () => {
    const body = StorePricesResponseSchema.parse(
      (await call('owner', 'GET /pricing/store-prices')).json(),
    );

    expect(body.items).toHaveLength(138);
    expect(body.items.at(-1)).toEqual({ wilayaCode: 69, deliveryType: 'stopdesk', price: null });
    expect(body.freeShippingFrom).toBeNull();
  });

  it('saves a bulk edit and quotes the fee for both delivery types', async () => {
    const update = await call('owner', 'PUT /pricing/store-prices', {
      items: [
        { wilayaCode: 16, deliveryType: 'home', price: 600 },
        { wilayaCode: 16, deliveryType: 'stopdesk', price: 400 },
        { wilayaCode: 59, deliveryType: 'home', price: 900 },
      ],
      freeShippingFrom: 10_000,
    });
    expect(update.statusCode).toBe(200);

    const home = await call(
      'agent',
      'GET /pricing/quote?wilayaCode=16&deliveryType=home&subtotal=5000',
    );
    const desk = await call('agent', 'GET /pricing/quote?wilayaCode=16&deliveryType=stopdesk');
    const free = await call(
      'agent',
      'GET /pricing/quote?wilayaCode=59&deliveryType=home&subtotal=10000',
    );
    const none = await call('agent', 'GET /pricing/quote?wilayaCode=59&deliveryType=stopdesk');

    expect(home.json()).toEqual({ available: true, fee: 600, freeShippingApplied: false });
    expect(desk.json().fee).toBe(400);
    expect(free.json()).toEqual({ available: true, fee: 0, freeShippingApplied: true });
    expect(none.json()).toEqual({ available: false, fee: null, freeShippingApplied: false });
  });

  it('rejects unknown wilayas and stops agents from editing prices', async () => {
    const unknown = await call('owner', 'PUT /pricing/store-prices', {
      items: [{ wilayaCode: 70, deliveryType: 'home', price: 500 }],
    });
    const agent = await call('agent', 'PUT /pricing/store-prices', { items: [] });

    expect(unknown.statusCode).toBe(400);
    expect(agent.statusCode).toBe(403);
  });

  it('keeps prices per store', async () => {
    const quote = await call('outsider', 'GET /pricing/quote?wilayaCode=16&deliveryType=home');

    expect(quote.json().available).toBe(false);
  });

  it('replaces a carrier rate card as a whole', async () => {
    const row = { fromWilaya: 16, toWilaya: 31, deliveryType: 'home', price: 500, returnFee: 200 };
    await call('owner', 'PUT /pricing/rate-cards/yalidine', {
      rows: [
        { ...row, weightLimitGrams: 5000 },
        { ...row, toWilaya: 9, weightLimitGrams: null },
      ],
    });
    const replaced = await call('owner', 'PUT /pricing/rate-cards/yalidine', {
      rows: [{ ...row, price: 550, weightLimitGrams: null }],
    });

    expect(replaced.json()).toEqual({ carrier: 'yalidine', rows: 1 });
    const { rows } = (await call('agent', 'GET /pricing/rate-cards/yalidine')).json();
    expect(rows).toEqual([{ ...row, price: 550, weightLimitGrams: null }]);
  });
});
