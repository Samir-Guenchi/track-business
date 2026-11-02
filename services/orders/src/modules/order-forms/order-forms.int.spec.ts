import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  ListOrderFormsResponseSchema,
  OrderFormSchema,
  PublicOrderFormSchema,
} from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { type FakeShipping, startFakeShipping } from '../../test/fake-shipping.js';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '13413413-1341-4341-8341-134134134134';
const OTHER = '13513513-1351-4351-8351-135135135135';
const OWNER = 'a0000000-0000-4000-8000-000000000134';
const AGENT = 'a0000000-0000-4000-8000-000000000135';
const RIVAL = 'a0000000-0000-4000-8000-000000000136';

const PRICES = {
  items: [
    { wilayaCode: 16, deliveryType: 'home' as const, price: 400 },
    { wilayaCode: 16, deliveryType: 'stopdesk' as const, price: 250 },
    { wilayaCode: 33, deliveryType: 'home' as const, price: null },
  ],
  freeShippingFrom: 10_000,
};

const newForm = {
  name: 'Sac été',
  title: 'Boutique Test',
  products: [{ id: 'sac-noir', name: 'Sac noir', unitPrice: 3500, variants: ['S', 'M'] }],
  deliveryTypes: ['home'],
};

type Call = { method: 'GET' | 'POST' | 'PUT'; url: string; payload?: object };

// Shares the orders API schema: pg_trgm lives there, and files run one at a time.
describe.skipIf(!baseUrl || !redisUrl)('order forms (real Postgres)', () => {
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let shipping: FakeShipping;
  const as = async (user: string, store: string, request: Call) =>
    app.inject({
      ...request,
      headers: { authorization: `Bearer ${await identity.tokenFor(user)}`, 'x-store-id': store },
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
      [RIVAL]: { [OTHER]: 'owner' },
    });
    shipping = await startFakeShipping({}, PRICES);
    const env = {
      DATABASE_URL: databaseUrl,
      REDIS_URL: redisUrl,
      IDENTITY_URL: identity.url,
      SHIPPING_URL: shipping.url,
      INTERNAL_TOKEN: 'internal-token-for-tests-0123456789',
      ROLE_CACHE_SECONDS: '0',
    };
    app = await startTestApp(testEnv(env));
    await app
      .get(PrismaService)
      .orderForm.deleteMany({ where: { storeId: { in: [STORE, OTHER] } } });
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
    await shipping?.close();
  });

  it('creates a form with a public key and serves it with the delivery prices', async () => {
    const created = await as(OWNER, STORE, {
      method: 'POST',
      url: '/orders/forms',
      payload: newForm,
    });
    expect(created.statusCode).toBe(201);
    const form = OrderFormSchema.parse(created.json());
    expect(form).toMatchObject({ enabled: true, maxQuantity: 5, theme: { accent: '#1f5c4a' } });

    const view = await app.inject({ method: 'GET', url: `/public/forms/${form.key}` });

    const body = PublicOrderFormSchema.parse(view.json());
    expect(body.prices).toEqual([{ wilayaCode: 16, deliveryType: 'home', price: 400 }]);
    expect(body).toMatchObject({ title: 'Boutique Test', freeShippingFrom: 10_000 });
    expect(JSON.stringify(body)).not.toContain(STORE);
  });

  it('lists forms to their store only and lets only managers edit them', async () => {
    const own = await as(OWNER, STORE, { method: 'GET', url: '/orders/forms' });
    const rival = await as(RIVAL, OTHER, { method: 'GET', url: '/orders/forms' });
    const [form] = ListOrderFormsResponseSchema.parse(own.json()).items;
    if (!form) throw new Error('form missing');
    const url = `/orders/forms/${form.id}`;
    const payload = { ...newForm, enabled: true };

    expect(ListOrderFormsResponseSchema.parse(rival.json()).items).toEqual([]);
    expect((await as(AGENT, STORE, { method: 'PUT', url, payload })).statusCode).toBe(403);
    expect((await as(RIVAL, OTHER, { method: 'PUT', url, payload })).statusCode).toBe(404);
  });

  it('hides a form once it is switched off', async () => {
    const created = await as(OWNER, STORE, {
      method: 'POST',
      url: '/orders/forms',
      payload: newForm,
    });
    const form = OrderFormSchema.parse(created.json());
    const url = `/orders/forms/${form.id}`;

    const off = await as(OWNER, STORE, {
      method: 'PUT',
      url,
      payload: { ...newForm, enabled: false },
    });
    const view = await app.inject({ method: 'GET', url: `/public/forms/${form.key}` });

    expect(OrderFormSchema.parse(off.json()).enabled).toBe(false);
    expect(view.statusCode).toBe(404);
  });

  it('refuses duplicate product ids and malformed keys', async () => {
    const products = [newForm.products[0], newForm.products[0]];
    const res = await as(OWNER, STORE, {
      method: 'POST',
      url: '/orders/forms',
      payload: { ...newForm, products },
    });
    const bad = await app.inject({ method: 'GET', url: '/public/forms/not-a-key' });

    expect(res.statusCode).toBe(400);
    expect(bad.statusCode).toBe(400);
  });
});
