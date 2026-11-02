import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { PendingShopOrdersResponseSchema } from '@trackecom/contracts';
import type { ExternalOrder } from '@trackecom/connectors';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { type FakeGeo, startFakeGeo } from '../../test/fake-geo.js';
import { shopOrder, withCustomer } from '../../test/shop-order.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { ConnectionsService } from '../connections/application/connections.service.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '48484848-4848-4848-8848-000000000048';
const OWNER = 'a4800000-0000-4000-8000-000000000001';
const AGENT = 'a4800000-0000-4000-8000-000000000002';

describe.skipIf(!baseUrl || !redisUrl)('shop webhooks and the fix queue (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=integrations_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let geo: FakeGeo;
  let prisma: PrismaService;
  let connectionId: string;
  const headers: Record<string, Record<string, string>> = {};

  const webhook = (orders: ExternalOrder[], signature = 'good', id = connectionId) =>
    app.inject({
      method: 'POST',
      url: `/webhooks/shops/${id}`,
      headers: { 'content-type': 'application/json', 'x-fake-signature': signature },
      payload: JSON.stringify(orders),
    });
  const post = (user: string, path: string, payload: object) =>
    app.inject({
      method: 'POST',
      url: `/integrations/orders/needs-fix/${path}`,
      headers: headers[user] ?? {},
      payload,
    });
  const pending = async () =>
    PendingShopOrdersResponseSchema.parse(
      (
        await app.inject({
          method: 'GET',
          url: '/integrations/orders/needs-fix',
          headers: headers[AGENT] ?? {},
        })
      ).json(),
    ).items;
  const sentCount = () => prisma.outboxEvent.count();

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({
      [OWNER]: { [STORE]: 'owner' },
      [AGENT]: { [STORE]: 'agent' },
    });
    for (const user of [OWNER, AGENT]) {
      headers[user] = {
        authorization: `Bearer ${await identity.tokenFor(user)}`,
        'x-store-id': STORE,
      };
    }
    geo = await startFakeGeo();
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, SHIPPING_URL: geo.url, ROLE_CACHE_SECONDS: '0' }));
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.outboxEvent.deleteMany();
    await prisma.shopConnection.deleteMany();
    const shop = { connector: 'woocommerce' as const, shopUrl: 'https://hooks.example' };
    const connection = await app
      .get(ConnectionsService)
      .connect(STORE, { ...shop, credentials: { token: 'good' } });
    connectionId = connection.id;
  });

  afterAll(async () => {
    await app?.close();
    await geo?.close();
    await identity?.close();
  });

  it('imports signed webhook orders once and refuses unsigned ones', async () => {
    const order = shopOrder('w1');

    expect((await webhook([order], 'forged')).statusCode).toBe(401);
    expect(
      (await webhook([order], 'good', '00000000-0000-4000-8000-000000000000')).statusCode,
    ).toBe(404);
    expect((await webhook([order])).json()).toEqual({ received: 1 });
    expect((await webhook([order])).json()).toEqual({ received: 0 });
    expect(await sentCount()).toBe(1);
  });

  it('lets a manager place a held order, checking the commune belongs to the wilaya', async () => {
    await webhook([withCustomer('w2', { province: 'Paris', phone: null })]);
    const [held] = await pending();
    expect(held).toMatchObject({ externalId: 'w2', problem: 'phone', total: 3100 });
    const fix = { connectionId, externalId: 'w2', phone: '0555 00 00 48', wilayaCode: 16 };

    expect((await post(AGENT, 'resolve', { ...fix, communeId: 1621 })).statusCode).toBe(403);
    const wrong = await post(OWNER, 'resolve', { ...fix, communeId: 3101 });
    expect(wrong.json()).toMatchObject({ error: { code: 'integrations.still_needs_fix' } });
    expect((await post(OWNER, 'resolve', { ...fix, communeId: 1621 })).statusCode).toBe(204);

    expect(await pending()).toEqual([]);
    expect(await sentCount()).toBe(1);
    const row = await prisma.importedOrder.findFirstOrThrow({ where: { externalId: 'w2' } });
    expect(row).toMatchObject({ state: 'sent', pending: null });
  });

  it('skips a held order for good and forgets its customer', async () => {
    await webhook([shopOrder('w3', { currency: 'EUR' })]);

    expect((await post(OWNER, 'skip', { connectionId, externalId: 'w3' })).statusCode).toBe(204);
    expect((await post(OWNER, 'skip', { connectionId, externalId: 'w3' })).statusCode).toBe(404);
    const row = await prisma.importedOrder.findFirstOrThrow({ where: { externalId: 'w3' } });
    expect(row).toMatchObject({ state: 'skipped', pending: null });
    expect(await sentCount()).toBe(0);
  });
});
