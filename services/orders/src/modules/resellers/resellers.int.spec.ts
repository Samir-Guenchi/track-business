import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  ListResellersResponseSchema,
  ResellerOrderCreatedSchema,
  ResellerPortalSchema,
  ResellerProductSchema,
  ResellerSchema,
} from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { type FakeShipping, startFakeShipping } from '../../test/fake-shipping.js';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '19800000-0000-4000-8000-000000000001';
const OTHER = '19800000-0000-4000-8000-000000000002';
const OWNER = '19800000-0000-4000-8000-000000000011';
const RIVAL = '19800000-0000-4000-8000-000000000012';
const PRICES = {
  items: [{ wilayaCode: 16, deliveryType: 'home' as const, price: 400 }],
  freeShippingFrom: null,
  freeShippingExcludedWilayas: [],
};
const customer = {
  name: 'Client Revendeur',
  phone: '0555 00 00 02',
  wilayaCode: 16,
  communeId: 1601,
  address: 'Rue test',
};

type Call = { method: 'GET' | 'POST' | 'PATCH'; url: string; payload?: object };

// Shares the orders API schema: pg_trgm lives there, and files run one at a time.
describe.skipIf(!baseUrl || !redisUrl)('resellers (real Postgres)', () => {
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let shipping: FakeShipping;
  let prisma: PrismaService;
  const auth: Record<string, Record<string, string>> = {};
  const as = (user: string, { method, url, payload }: Call) =>
    app.inject({ method, url, headers: auth[user] ?? {}, ...(payload ? { payload } : {}) });
  let productId = '';
  let reseller = { id: '', portalCode: '' };
  const sendOrder = (sellingPrice: number) =>
    app.inject({
      method: 'POST',
      url: `/public/resellers/${reseller.portalCode}/orders`,
      payload: {
        customer,
        items: [{ productId, quantity: 2, sellingPrice }],
        deliveryType: 'home',
      },
    });
  const portal = async () =>
    ResellerPortalSchema.parse(
      (await app.inject({ method: 'GET', url: `/public/resellers/${reseller.portalCode}` })).json(),
    );

  beforeAll(async () => {
    const databaseUrl = `${baseUrl}?schema=orders_api_test`;
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({
      [OWNER]: { [STORE]: 'owner' },
      [RIVAL]: { [OTHER]: 'owner' },
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
    prisma = app.get(PrismaService);
    for (const [user, store] of [
      [OWNER, STORE],
      [RIVAL, OTHER],
    ] as const) {
      auth[user] = {
        authorization: `Bearer ${await identity.tokenFor(user)}`,
        'x-store-id': store,
      };
    }
    await prisma.resellerOrder.deleteMany({ where: { storeId: STORE } });
    await prisma.reseller.deleteMany({ where: { storeId: STORE } });
    await prisma.resellerProduct.deleteMany({ where: { storeId: STORE } });
    await prisma.order.deleteMany({ where: { storeId: STORE } });
    const product = await as(OWNER, {
      method: 'POST',
      url: '/resellers/catalogue',
      payload: { name: 'Robe', supplierPrice: 2500, minPrice: 3000 },
    });
    productId = ResellerProductSchema.parse(product.json()).id;
    const created = await as(OWNER, {
      method: 'POST',
      url: '/resellers',
      payload: { name: 'Revendeur Test', phone: '0555 00 00 01' },
    });
    reseller = ResellerSchema.parse(created.json());
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
    await shipping?.close();
  });

  it('turns a reseller order into a normal order with the margin pending', async () => {
    expect((await sendOrder(2800)).statusCode).toBe(400);
    const sent = await sendOrder(3500);
    expect(sent.statusCode).toBe(201);
    expect(ResellerOrderCreatedSchema.parse(sent.json())).toMatchObject({
      codAmount: 7400,
      margin: 2000,
      shippingFee: 400,
    });
    const order = await prisma.order.findFirstOrThrow({ where: { storeId: STORE } });
    expect(order).toMatchObject({ source: 'reseller', status: 'new', tags: ['reseller'] });
    const view = await portal();
    expect(view.catalogue).toHaveLength(1);
    expect(view.orders[0]).toMatchObject({ margin: 2000, marginState: 'pending' });
  });

  it('owes the margin once delivered and pays it once', async () => {
    await prisma.order.updateMany({ where: { storeId: STORE }, data: { status: 'delivered' } });
    const list = ListResellersResponseSchema.parse(
      (await as(OWNER, { method: 'GET', url: '/resellers' })).json(),
    );
    expect(list.items[0]?.stats).toMatchObject({
      delivered: 1,
      deliveryRate: 1,
      marginEarned: 2000,
    });

    const payout = { method: 'POST', url: `/resellers/${reseller.id}/payout` } as const;
    expect((await as(OWNER, payout)).json()).toEqual({ orders: 1, amount: 2000 });
    expect((await as(OWNER, payout)).json()).toEqual({ orders: 0, amount: 0 });
    expect((await portal()).stats).toMatchObject({ marginEarned: 0, marginPaid: 2000 });
  });

  it('refuses orders from a paused reseller and hides resellers from other stores', async () => {
    const url = `/resellers/${reseller.id}`;
    const pause = { name: 'Revendeur Test', phone: '0555 00 00 01', active: false };
    expect((await as(RIVAL, { method: 'PATCH', url, payload: pause })).statusCode).toBe(404);
    expect((await as(RIVAL, { method: 'GET', url: '/resellers' })).json()).toEqual({ items: [] });
    expect((await as(OWNER, { method: 'PATCH', url, payload: pause })).statusCode).toBe(200);
    expect((await sendOrder(3500)).statusCode).toBe(403);
    expect((await portal()).active).toBe(false);
  });
});
