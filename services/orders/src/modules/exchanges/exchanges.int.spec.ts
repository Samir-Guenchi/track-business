import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { OrderHistoryResponseSchema, OrderSchema } from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '13800000-0000-4000-8000-000000000001';
const MANAGER = '13800000-0000-4000-8000-000000000011';

const newOrder = {
  customer: {
    name: 'Client Echange',
    phone: '0555 00 01 38',
    wilayaCode: 16,
    communeId: 1601,
    address: 'Rue E',
  },
  items: [{ name: 'Robe - taille M', quantity: 2, unitPrice: 3000 }],
  deliveryType: 'home',
  shippingFee: 500,
};

// Shares the orders API schema: pg_trgm lives there, and files run one at a time.
describe.skipIf(!baseUrl || !redisUrl)('exchanges (real Postgres)', () => {
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let prisma: PrismaService;
  const call = async (request: { method: 'GET' | 'POST'; url: string; payload?: object }) =>
    app.inject({
      ...request,
      headers: { authorization: `Bearer ${await identity.tokenFor(MANAGER)}`, 'x-store-id': STORE },
    });
  const deliveredOrder = async () => {
    const order = OrderSchema.parse(
      (await call({ method: 'POST', url: '/orders', payload: newOrder })).json(),
    );
    await prisma.order.update({ where: { id: order.id }, data: { status: 'delivered' } });
    return order;
  };

  beforeAll(async () => {
    const databaseUrl = `${baseUrl}?schema=orders_api_test`;
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({ [MANAGER]: { [STORE]: 'manager' } });
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('creates one linked exchange order and shows it in both histories', async () => {
    const original = await deliveredOrder();
    const itemId = original.items[0]?.id ?? '';
    const payload = {
      lines: [{ itemId, quantity: 1, replacement: 'Robe - taille L', priceDifference: 200 }],
      deliveryPaidBy: 'customer',
      shippingFee: 400,
    };
    const response = await call({
      method: 'POST',
      url: `/orders/${original.id}/exchange`,
      payload,
    });
    expect(response.statusCode).toBe(201);
    const exchange = OrderSchema.parse(response.json());
    expect(exchange).toMatchObject({
      source: 'exchange',
      status: 'new',
      codAmount: 600,
      tags: ['echange'],
      exchange: { ofOrderId: original.id, collect: '1 x Robe - taille M' },
      customer: { name: 'Client Echange', address: 'Rue E' },
    });

    const history = OrderHistoryResponseSchema.parse(
      (await call({ method: 'GET', url: `/orders/${original.id}/history` })).json(),
    );
    expect(history.items[0]).toMatchObject({ kind: 'exchanged', note: exchange.ref });

    const again = await call({ method: 'POST', url: `/orders/${original.id}/exchange`, payload });
    expect(again.json()).toMatchObject({ error: { code: 'orders.exchange_already_exchanged' } });
  });

  it('refuses an order that was not delivered', async () => {
    const order = OrderSchema.parse(
      (await call({ method: 'POST', url: '/orders', payload: newOrder })).json(),
    );
    const payload = {
      lines: [{ itemId: order.items[0]?.id ?? '', quantity: 1, replacement: 'Robe - L' }],
      deliveryPaidBy: 'store',
      shippingFee: 0,
    };
    const response = await call({ method: 'POST', url: `/orders/${order.id}/exchange`, payload });
    expect(response.statusCode).toBe(409);
  });
});
