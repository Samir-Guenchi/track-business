import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { OrderContactSchema, OrderOriginSchema, OrderSchema } from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '46000000-0000-4000-8000-0000000000a1';
const OTHER = '46000000-0000-4000-8000-0000000000a2';
const MANAGER = 'c4600000-0000-4000-8000-0000000000a1';
const SECRET = 'internal-test-secret-0123456789abcdef';

describe.skipIf(!baseUrl || !redisUrl)('internal order contact (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=orders_api_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let orderId = '';

  const contact = (store: string, token?: string) =>
    app.inject({
      method: 'GET',
      url: `/internal/stores/${store}/orders/${orderId}/contact`,
      headers: token ? { 'x-internal-token': token } : {},
    });

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({ [MANAGER]: { [STORE]: 'manager' } });
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0', INTERNAL_TOKEN: SECRET }));
    const created = await app.inject({
      method: 'POST',
      url: '/orders',
      headers: { authorization: `Bearer ${await identity.tokenFor(MANAGER)}`, 'x-store-id': STORE },
      payload: {
        customer: {
          name: 'Client Test',
          phone: '0555000461',
          wilayaCode: 16,
          communeId: 1621,
          address: 'Rue',
        },
        items: [{ name: 'Robe', quantity: 1, unitPrice: 2500 }],
        deliveryType: 'home',
        shippingFee: 600,
      },
    });
    orderId = OrderSchema.parse(created.json()).id;
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('gives another service the contact with the shared token', async () => {
    const response = await contact(STORE, SECRET);

    expect(OrderContactSchema.parse(response.json())).toMatchObject({
      orderId,
      name: 'Client Test',
      phone: '+213555000461',
    });
  });

  it('tells integrations where the order came from', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/internal/stores/${STORE}/orders/${orderId}/origin`,
      headers: { 'x-internal-token': SECRET },
    });

    expect(OrderOriginSchema.parse(response.json())).toEqual({
      orderId,
      source: 'manual',
      externalRef: null,
    });
  });

  it('refuses callers without the token and other stores', async () => {
    expect((await contact(STORE)).statusCode).toBe(401);
    expect((await contact(STORE, `${SECRET}x`)).statusCode).toBe(401);
    expect((await contact(OTHER, SECRET)).statusCode).toBe(404);
  });
});
