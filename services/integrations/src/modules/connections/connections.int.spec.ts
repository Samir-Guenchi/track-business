import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  ConnectorsResponseSchema,
  IntegrationSchema,
  IntegrationsResponseSchema,
} from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { ConnectionsService } from './application/connections.service.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '46464646-4646-4646-8646-464646464646';
const OTHER = '46464646-4646-4646-8646-000000000002';
const OWNER = 'a4600000-0000-4000-8000-000000000001';
const AGENT = 'a4600000-0000-4000-8000-000000000002';
const RIVAL = 'a4600000-0000-4000-8000-000000000003';
const SHOP = { connector: 'woocommerce', shopUrl: 'https://shop.example' };

describe.skipIf(!baseUrl || !redisUrl)('shop connections (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=integrations_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let prisma: PrismaService;
  const headers: Record<string, Record<string, string>> = {};

  type Method = 'GET' | 'POST' | 'DELETE';
  const call = (user: string, request: `${Method} ${string}`, payload?: object) => {
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
      [OWNER]: { [STORE]: 'owner' },
      [AGENT]: { [STORE]: 'agent' },
      [RIVAL]: { [OTHER]: 'owner' },
    });
    for (const [user, store] of [
      [OWNER, STORE],
      [AGENT, STORE],
      [RIVAL, OTHER],
    ] as const) {
      const token = await identity.tokenFor(user);
      headers[user] = { authorization: `Bearer ${token}`, 'x-store-id': store };
    }
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
    prisma = app.get(PrismaService);
    await prisma.shopConnection.deleteMany();
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('lists the platforms with the fields a seller fills', async () => {
    const body = ConnectorsResponseSchema.parse(
      (await call(AGENT, 'GET /integrations/connectors')).json(),
    );

    expect(body.items.map((item) => item.code)).toEqual(['shopify', 'woocommerce']);
    expect(body.items[0]?.credentialFields.map((field) => field.key)).toEqual([
      'accessToken',
      'webhookSecret',
    ]);
  });

  it('refuses credentials the shop rejects, and keeps nothing', async () => {
    const response = await call(OWNER, 'POST /integrations', {
      ...SHOP,
      credentials: { token: 'bad' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: { code: 'integrations.invalid_credentials' } });
    expect(await prisma.shopConnection.count()).toBe(0);
  });

  it('connects a shop once, encrypts its token and never returns it', async () => {
    const payload = { ...SHOP, credentials: { token: 'good' } };
    const first = await call(OWNER, 'POST /integrations', payload);
    const again = await call(OWNER, 'POST /integrations', payload);

    const shop = IntegrationSchema.parse(first.json());
    expect(IntegrationSchema.parse(again.json()).id).toBe(shop.id);
    expect(shop).toMatchObject({ shopName: 'Fake shop', status: 'connected', ordersImported: 0 });
    expect(JSON.stringify(first.json())).not.toContain('good');
    const row = await prisma.shopConnection.findUniqueOrThrow({ where: { id: shop.id } });
    expect(Buffer.from(row.secret).toString('utf8')).not.toContain('good');
    const connection = { ...shop, storeId: STORE } as never;
    expect(await app.get(ConnectionsService).open(connection)).toMatchObject({
      ctx: { credentials: { token: 'good' } },
    });
  });

  it('keeps shops to their store and changes to managers', async () => {
    const list = IntegrationsResponseSchema.parse((await call(AGENT, 'GET /integrations')).json());
    const rival = IntegrationsResponseSchema.parse((await call(RIVAL, 'GET /integrations')).json());
    const id = list.items[0]?.id ?? '';

    expect(list.items).toHaveLength(1);
    expect(rival.items).toEqual([]);
    expect((await call(AGENT, `DELETE /integrations/${id}`)).statusCode).toBe(403);
    expect((await call(RIVAL, `DELETE /integrations/${id}`)).statusCode).toBe(404);
    expect((await call(OWNER, `DELETE /integrations/${id}`)).statusCode).toBe(204);
    expect(await prisma.shopConnection.count()).toBe(0);
  });
});
