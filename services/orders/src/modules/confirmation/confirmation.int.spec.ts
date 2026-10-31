import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { NextCallResponseSchema } from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '44444444-4444-4444-8444-444444444444';
/** Identity user ids are UUIDs (locks and rules store them as such). */
const USERS = {
  manager: 'a0000000-0000-4000-8000-000000000001',
  ali: 'a0000000-0000-4000-8000-000000000002',
  sara: 'a0000000-0000-4000-8000-000000000003',
} as const;
type User = keyof typeof USERS;

const order = (wilayaCode: number) => ({
  customer: {
    name: 'Client Test',
    phone: '0555 00 00 03',
    wilayaCode,
    communeId: 1621,
    address: 'Rue A',
  },
  items: [{ name: 'Robe', quantity: 1, unitPrice: 2500 }],
  deliveryType: 'home',
  shippingFee: 600,
});

// Shares the orders API schema: pg_trgm lives there, and files run one at a time.
describe.skipIf(!baseUrl || !redisUrl)('confirmation API (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=orders_api_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let prisma: PrismaService;
  const headers: Partial<Record<User, Record<string, string>>> = {};

  type Method = 'GET' | 'POST' | 'PUT';
  const call = (user: User, request: `${Method} ${string}`, payload?: object) => {
    const [method, url] = request.split(' ') as [Method, string];
    return app.inject({
      method,
      url,
      headers: headers[user] ?? {},
      ...(payload ? { payload } : {}),
    });
  };
  const next = async (user: User) =>
    NextCallResponseSchema.parse((await call(user, 'GET /confirmation/next')).json()).item;
  const logCall = (user: User, orderId: string, result: object) =>
    call(user, 'POST /confirmation/calls', { orderId, durationSec: 30, ...result });

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({
      [USERS.manager]: { [STORE]: 'manager' },
      [USERS.ali]: { [STORE]: 'agent' },
      [USERS.sara]: { [STORE]: 'agent' },
    });
    for (const [user, id] of Object.entries(USERS)) {
      headers[user as User] = {
        authorization: `Bearer ${await identity.tokenFor(id)}`,
        'x-store-id': STORE,
      };
    }
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
    prisma = app.get(PrismaService);
    await prisma.$transaction([
      prisma.callAttempt.deleteMany({ where: { storeId: STORE } }),
      prisma.order.deleteMany({ where: { storeId: STORE } }),
      prisma.confirmationSettings.deleteMany({ where: { storeId: STORE } }),
    ]);
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('never gives the same order to two agents, and keeps it with its holder', async () => {
    const first = (await call('manager', 'POST /orders', order(16))).json();
    const second = (await call('manager', 'POST /orders', order(31))).json();

    const [forAli, forSara] = await Promise.all([next('ali'), next('sara')]);
    const again = await next('ali');

    expect(new Set([forAli?.order.id, forSara?.order.id])).toEqual(new Set([first.id, second.id]));
    expect(again?.order.id).toBe(forAli?.order.id);
    expect(await next('manager')).toBeNull();
  });

  it('only lets the holder log a call, then frees the order', async () => {
    const held = await next('ali');
    const orderId = held?.order.id ?? '';

    const stolen = await logCall('sara', orderId, { outcome: 'busy' });
    const logged = await logCall('ali', orderId, { outcome: 'confirmed' });

    expect(stolen.json()).toMatchObject({ error: { code: 'confirmation.not_locked' } });
    expect(logged.statusCode).toBe(201);
    expect(logged.json().orderStatus).toBe('confirmed');
    const history = (await call('manager', `GET /orders/${orderId}/history`)).json();
    expect(history.items[0]).toMatchObject({
      kind: 'call_logged',
      fromStatus: 'new',
      toStatus: 'confirmed',
    });
  });

  it('brings a postponed order back first once its time comes', async () => {
    const held = await next('sara');
    const orderId = held?.order.id ?? '';
    const later = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await logCall('sara', orderId, { outcome: 'postponed', callBackAt: later });
    const newer = (await call('manager', 'POST /orders', order(9))).json();

    expect((await next('ali'))?.order.id).toBe(newer.id);
    await call('ali', `POST /confirmation/orders/${newer.id}/release`);
    await prisma.order.update({
      where: { id: orderId },
      data: { nextCallAt: new Date(Date.now() - 1000) },
    });
    expect((await next('ali'))?.order.id).toBe(orderId);
  });

  it('marks an order unreachable after the store limit of unanswered calls', async () => {
    const settings = { maxAttemptsPerDay: 5, unreachableAfter: 2 };
    expect((await call('ali', 'PUT /confirmation/settings', settings)).statusCode).toBe(403);
    await call('manager', 'PUT /confirmation/settings', settings);

    const orderId = (await next('ali'))?.order.id ?? '';
    const firstTry = await logCall('ali', orderId, { outcome: 'no_answer' });
    await next('ali');
    const secondTry = await logCall('ali', orderId, { outcome: 'busy' });

    expect(firstTry.json().orderStatus).toBe('to_confirm');
    expect(secondTry.json().orderStatus).toBe('unreachable');
  });

  it('routes orders by wilaya when the store uses assignment rules', async () => {
    await prisma.order.updateMany({
      where: { storeId: STORE },
      data: { lockedBy: null, lockedUntil: null },
    });
    await call('manager', 'PUT /confirmation/settings', {
      assignment: 'rules',
      agentRules: [{ agentId: USERS.sara, wilayaCodes: [59] }],
    });
    const oran = (await call('manager', 'POST /orders', order(59))).json();

    expect((await next('sara'))?.order.id).toBe(oran.id);
  });
});
