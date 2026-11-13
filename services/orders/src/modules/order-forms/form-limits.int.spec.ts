import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DEFAULT_FORM_LIMITS, OrderFormSchema } from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { type FakeShipping, startFakeShipping } from '../../test/fake-shipping.js';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '13513513-1351-4351-8351-135135135135';
const OWNER = 'a0000000-0000-4000-8000-000000000235';
const AGENT = 'a0000000-0000-4000-8000-000000000236';
const PRICES = {
  items: [{ wilayaCode: 16, deliveryType: 'home' as const, price: 400 }],
  freeShippingFrom: null,
  freeShippingExcludedWilayas: [],
};
const FORM = {
  name: 'Landing limites',
  title: 'Boutique Limites',
  products: [
    { id: 'sac', name: 'Sac', unitPrice: 3500, variants: [] },
    { id: 'cap', name: 'Casquette', unitPrice: 1200, variants: [] },
  ],
  deliveryTypes: ['home'],
};
const order = (productId: string) => ({
  name: 'Client Limite',
  phone: '0555 00 02 35',
  wilayaCode: 16,
  communeId: 1601,
  address: 'Rue L',
  deliveryType: 'home',
  productId,
  quantity: 1,
});

// Shares the orders API schema with the other integration files, which run one at a time.
describe.skipIf(!baseUrl || !redisUrl)('per-store form limits (real Postgres)', () => {
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let shipping: FakeShipping;
  let key = '';
  const as = async (user: string) => ({
    authorization: `Bearer ${await identity.tokenFor(user)}`,
    'x-store-id': STORE,
  });
  const limits = async (user: string, payload?: object) =>
    app.inject({
      method: payload ? 'PUT' : 'GET',
      url: '/orders/forms/limits',
      headers: await as(user),
      ...(payload ? { payload } : {}),
    });
  const submit = (productId: string) =>
    app.inject({
      method: 'POST',
      url: `/public/forms/${key}/orders`,
      payload: order(productId),
      remoteAddress: '203.0.113.35',
    });

  beforeAll(async () => {
    const databaseUrl = `${baseUrl}?schema=orders_api_test`;
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({
      [OWNER]: { [STORE]: 'owner' },
      [AGENT]: { [STORE]: 'agent' },
    });
    shipping = await startFakeShipping({ 16: [1601] }, PRICES);
    app = await startTestApp(
      testEnv({
        DATABASE_URL: databaseUrl,
        REDIS_URL: redisUrl,
        IDENTITY_URL: identity.url,
        SHIPPING_URL: shipping.url,
        INTERNAL_TOKEN: 'internal-token-for-tests-0123456789',
        ROLE_CACHE_SECONDS: '0',
      }),
    );
    const prisma = app.get(PrismaService);
    await prisma.orderFormLimits.deleteMany({ where: { storeId: STORE } });
    await prisma.formSubmission.deleteMany({ where: { storeId: STORE } });
    await prisma.order.deleteMany({ where: { storeId: STORE } });
    const created = await app.inject({
      method: 'POST',
      url: '/orders/forms',
      headers: await as(OWNER),
      payload: FORM,
    });
    key = OrderFormSchema.parse(created.json()).key;
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
    await shipping?.close();
  });

  it('starts from the platform limits and refuses looser ones', async () => {
    const looser = {
      ...DEFAULT_FORM_LIMITS,
      perPhonePerHour: DEFAULT_FORM_LIMITS.perPhonePerHour + 1,
    };

    expect((await limits(AGENT)).json()).toEqual(DEFAULT_FORM_LIMITS);
    expect((await limits(OWNER, looser)).statusCode).toBe(400);
  });

  it('lets only store managers make them stricter', async () => {
    const strict = { ...DEFAULT_FORM_LIMITS, perPhonePerHour: 1 };

    expect((await limits(AGENT, strict)).statusCode).toBe(403);
    expect((await limits(OWNER, strict)).json()).toEqual(strict);
    expect((await limits(AGENT)).json()).toEqual(strict);
  });

  it('applies the stricter limit to public submissions', async () => {
    const first = await submit('sac');
    const second = await submit('cap');

    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(429);
  });
});
