import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { BlacklistEntrySchema, ListOrdersResponseSchema, OrderSchema } from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '52525252-5252-4252-8252-525252525252';
const USERS = {
  manager: 'c5200000-0000-4000-8000-000000000001',
  agent: 'c5200000-0000-4000-8000-000000000002',
} as const;
type User = keyof typeof USERS;

const order = (customer: object = {}) => ({
  customer: {
    name: 'Client Test',
    phone: '0555 00 00 11',
    wilayaCode: 16,
    communeId: 1621,
    address: 'Rue des tests',
    ...customer,
  },
  items: [{ name: 'Robe', quantity: 1, unitPrice: 2500 }],
  deliveryType: 'home',
  shippingFee: 600,
});

describe.skipIf(!baseUrl || !redisUrl)('blacklist and fake-order checks (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=orders_api_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let prisma: PrismaService;
  const headers: Partial<Record<User, Record<string, string>>> = {};

  type Method = 'GET' | 'POST' | 'DELETE';
  const call = (user: User, request: `${Method} ${string}`, payload?: object) => {
    const [method, url] = request.split(' ') as [Method, string];
    return app.inject({
      method,
      url,
      headers: headers[user] ?? {},
      ...(payload ? { payload } : {}),
    });
  };
  const create = async (customer: object = {}) =>
    OrderSchema.parse((await call('manager', 'POST /orders', order(customer))).json());

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({
      [USERS.manager]: { [STORE]: 'manager' },
      [USERS.agent]: { [STORE]: 'agent' },
    });
    for (const [user, id] of Object.entries(USERS) as [User, string][]) {
      headers[user] = {
        authorization: `Bearer ${await identity.tokenFor(id)}`,
        'x-store-id': STORE,
      };
    }
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
    prisma = app.get(PrismaService);
    await prisma.blacklistEntry.deleteMany({ where: { storeId: STORE } });
    await prisma.order.deleteMany({ where: { storeId: STORE } });
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('accepts a normal order without flags', async () => {
    expect((await create()).riskFlags).toEqual([]);
  });

  it('flags fake-looking phones and names', async () => {
    const fake = await create({ name: 'xzkq qwrt', phone: '0555 12 34 56' });

    expect(fake.riskFlags).toEqual(['suspicious_phone', 'gibberish_name']);
  });

  it('flags the third order from one phone within minutes', async () => {
    await create({ phone: '0555 00 00 21' });
    await create({ phone: '0555 00 00 21' });

    expect((await create({ phone: '0555 00 00 21' })).riskFlags).toContain('order_burst');
  });

  it('flags blacklisted phones and names until the entry is removed', async () => {
    const added = await call('manager', 'POST /blacklist', {
      phone: '+213555000031',
      reason: 'refused_parcel',
    });
    expect(added.statusCode).toBe(201);
    await call('manager', 'POST /blacklist', {
      name: 'Faux  Client',
      communeId: 1621,
      reason: 'fake_order',
    });

    expect((await create({ phone: '0555000031' })).riskFlags).toEqual(['blacklisted']);
    expect((await create({ name: 'faux client', phone: '0555000032' })).riskFlags).toEqual([
      'blacklisted',
    ]);

    const { id } = BlacklistEntrySchema.parse(added.json());
    expect((await call('manager', `DELETE /blacklist/${id}`)).statusCode).toBe(204);
    expect((await create({ phone: '0555000031' })).riskFlags).toEqual([]);
  });

  it('ignores expired entries', async () => {
    await call('manager', 'POST /blacklist', {
      phone: '0555000041',
      reason: 'other',
      expiresAt: '2020-01-01T00:00:00.000Z',
    });

    expect((await create({ phone: '0555000041' })).riskFlags).toEqual([]);
  });

  it('lists only flagged orders on request', async () => {
    const page = ListOrdersResponseSchema.parse(
      (await call('agent', 'GET /orders?flagged=true&limit=50')).json(),
    );

    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((item) => item.riskFlags.length > 0)).toBe(true);
  });

  it('lets agents read the blacklist but not change it', async () => {
    const list = await call('agent', 'GET /blacklist?phone=0555000031');
    expect(list.statusCode).toBe(200);
    expect(
      (await call('agent', 'POST /blacklist', { phone: '0555000051', reason: 'other' })).statusCode,
    ).toBe(403);
  });
});
