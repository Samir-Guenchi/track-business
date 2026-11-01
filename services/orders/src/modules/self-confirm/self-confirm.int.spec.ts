import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfirmationLinkSchema, OrderSchema, SelfConfirmViewSchema } from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '54540000-0000-4000-8000-000000000002';
const AGENT = 'c5400000-0000-4000-8000-000000000002';
const MANAGER = 'c5400000-0000-4000-8000-000000000003';

describe.skipIf(!baseUrl || !redisUrl)('customer self-confirmation (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=orders_api_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  const auth: Record<string, Record<string, string>> = {};

  const newOrder = async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/orders',
      headers: auth[MANAGER] ?? {},
      payload: {
        customer: {
          name: 'Client Test',
          phone: '0555000551',
          wilayaCode: 16,
          communeId: 1621,
          address: 'Rue',
        },
        items: [{ name: 'Robe', quantity: 2, unitPrice: 2500 }],
        deliveryType: 'home',
        shippingFee: 600,
      },
    });
    return OrderSchema.parse(response.json());
  };
  const newLink = async (orderId: string) => {
    const response = await app.inject({
      method: 'POST',
      url: `/orders/${orderId}/confirmation-link`,
      headers: auth[AGENT] ?? {},
    });
    expect(response.statusCode).toBe(201);
    const link = ConfirmationLinkSchema.parse(response.json());
    return link.url.split('/').at(-1) ?? '';
  };
  const publicCall = (method: 'GET' | 'POST', token: string, payload?: object) =>
    app.inject({ method, url: `/public/confirm/${token}`, ...(payload ? { payload } : {}) });
  const orderStatus = async (id: string) =>
    OrderSchema.parse(
      (
        await app.inject({ method: 'GET', url: `/orders/${id}`, headers: auth[MANAGER] ?? {} })
      ).json(),
    );

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({
      [AGENT]: { [STORE]: 'agent' },
      [MANAGER]: { [STORE]: 'manager' },
    });
    for (const user of [AGENT, MANAGER]) {
      auth[user] = {
        authorization: `Bearer ${await identity.tokenFor(user)}`,
        'x-store-id': STORE,
      };
    }
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('shows the order without the phone, and confirms it once', async () => {
    const order = await newOrder();
    const token = await newLink(order.id);

    const view = SelfConfirmViewSchema.parse((await publicCall('GET', token)).json());
    expect(view).toMatchObject({
      ref: order.ref,
      canAnswer: true,
      items: [{ name: 'Robe', quantity: 2 }],
    });
    expect(JSON.stringify(view)).not.toContain('555000551');

    const answered = await publicCall('POST', token, { action: 'confirm' });
    expect(answered.json()).toEqual({ status: 'confirmed' });
    expect((await publicCall('POST', token, { action: 'cancel' })).statusCode).toBe(409);
    expect((await orderStatus(order.id)).status).toBe('confirmed');
  });

  it('lets the customer fix the address', async () => {
    const order = await newOrder();
    const token = await newLink(order.id);

    const payload = {
      action: 'change_address',
      wilayaCode: 16,
      communeId: 1601,
      address: 'Cité 5 juillet',
    };
    expect((await publicCall('POST', token, payload)).statusCode).toBe(200);

    const after = await orderStatus(order.id);
    expect(after.customer).toMatchObject({ communeId: 1601, address: 'Cité 5 juillet' });
  });

  it('refuses unknown and malformed tokens', async () => {
    expect((await publicCall('GET', 'A'.repeat(32))).statusCode).toBe(404);
    expect((await publicCall('GET', 'short')).statusCode).toBe(400);
  });
});
