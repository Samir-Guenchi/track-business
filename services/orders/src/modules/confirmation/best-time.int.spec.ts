import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { BestTimeResponseSchema, NextCallResponseSchema, OrderSchema } from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '54540000-0000-4000-8000-000000000001';
const MANAGER = 'c5400000-0000-4000-8000-000000000001';

describe.skipIf(!baseUrl || !redisUrl)('best time to call (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=orders_api_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let prisma: PrismaService;
  let headers: Record<string, string> = {};

  const get = (url: string) => app.inject({ method: 'GET', url, headers });

  /** Ten calls at one Algiers hour, `answered` of which reached the customer, a week ago. */
  const seedCalls = (orderId: string, hour: number, answered: number) => {
    const at = new Date(Date.now() - 7 * 86_400_000);
    at.setUTCHours(hour - 1, 15, 0, 0);
    return prisma.callAttempt.createMany({
      data: Array.from({ length: 10 }, (_, i) => ({
        id: randomUUID(),
        storeId: STORE,
        orderId,
        agentId: MANAGER,
        outcome: i < answered ? 'call_back' : 'no_answer',
        durationSec: 30,
        at,
      })),
    });
  };

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({ [MANAGER]: { [STORE]: 'manager' } });
    headers = { authorization: `Bearer ${await identity.tokenFor(MANAGER)}`, 'x-store-id': STORE };
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, ROLE_CACHE_SECONDS: '0' }));
    prisma = app.get(PrismaService);
    await prisma.callAttempt.deleteMany({ where: { storeId: STORE } });
    await prisma.order.deleteMany({ where: { storeId: STORE } });
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('learns the hour the wilaya answers most and shows it on the next call', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/orders',
      headers,
      payload: {
        customer: {
          name: 'Client Test',
          phone: '0555000541',
          wilayaCode: 31,
          communeId: 3101,
          address: 'Rue',
        },
        items: [{ name: 'Robe', quantity: 1, unitPrice: 2500 }],
        deliveryType: 'home',
        shippingFee: 600,
      },
    });
    const order = OrderSchema.parse(created.json());
    await seedCalls(order.id, 10, 2);
    await seedCalls(order.id, 14, 4);
    await seedCalls(order.id, 19, 9);

    const rates = BestTimeResponseSchema.parse(
      (await get('/confirmation/best-time?wilayaCode=31')).json(),
    );
    expect(rates.best).toMatchObject({ bestHour: 19, basis: 'wilaya' });
    expect(rates.hours.find((hour) => hour.hour === 10)?.attempts).toBe(10);

    const next = NextCallResponseSchema.parse((await get('/confirmation/next')).json());
    expect(next.item?.bestTime).toMatchObject({ bestHour: 19, basis: 'customer' });
  });
});
