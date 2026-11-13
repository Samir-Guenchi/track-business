import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  type EventEnvelope,
  INTEGRATION_EVENTS,
  type OrderReceivedEventInput,
} from '@trackecom/contracts';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { ImportShopOrderUseCase } from './application/import-shop-order.use-case.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '47474747-4747-4747-8747-474747474747';

const received = (externalId: string, cancelled = false): EventEnvelope => {
  const data: OrderReceivedEventInput = {
    connector: 'shopify',
    externalId,
    externalName: '#1001',
    cancelled,
    order: {
      customer: {
        name: 'Client Test',
        phone: '0555 00 00 47',
        wilayaCode: 16,
        communeId: 1621,
        address: 'Rue des tests',
      },
      items: [{ name: 'Robe', quantity: 1, unitPrice: 2500 }],
      deliveryType: 'home',
      shippingFee: 600,
      notes: 'Livrer le soir',
    },
  };
  return {
    id: randomUUID(),
    type: INTEGRATION_EVENTS.orderReceived,
    occurredAt: '2026-11-01T10:00:00.000Z',
    storeId: STORE,
    correlationId: randomUUID(),
    data,
  };
};

// Shares the orders API schema: pg_trgm lives there, and files run one at a time.
describe.skipIf(!baseUrl || !redisUrl)('shop orders from integrations (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=orders_api_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let prisma: PrismaService;
  let importOrder: ImportShopOrderUseCase;

  const ordersOf = (externalRef: string) =>
    prisma.order.findMany({ where: { storeId: STORE, source: 'shopify', externalRef } });

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({});
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv(env));
    prisma = app.get(PrismaService);
    importOrder = app.get(ImportShopOrderUseCase);
    await prisma.order.deleteMany({ where: { storeId: STORE } });
  });

  afterAll(async () => {
    await app?.close();
    await identity?.close();
  });

  it('creates the order once, however often the shop sends it', async () => {
    const first = await importOrder.execute(received('shop-1'));
    const again = await importOrder.execute(received('shop-1'));

    expect([first, again]).toEqual(['created', 'duplicate']);
    const [order, ...others] = await ordersOf('shop-1');
    expect(others).toEqual([]);
    expect(order).toMatchObject({ status: 'new', notes: 'shopify #1001 · Livrer le soir' });
  });

  it('settles a race between a webhook and the backfill on one order', async () => {
    const results = await Promise.all([
      importOrder.execute(received('shop-2')),
      importOrder.execute(received('shop-2')),
    ]);

    expect(results.sort()).toEqual(['created', 'duplicate']);
    expect(await ordersOf('shop-2')).toHaveLength(1);
  });

  it('cancels an imported order cancelled in the shop, and skips a new cancelled one', async () => {
    await importOrder.execute(received('shop-3'));

    expect(await importOrder.execute(received('shop-3', true))).toBe('cancelled');
    expect((await ordersOf('shop-3'))[0]?.status).toBe('cancelled');
    expect(await importOrder.execute(received('shop-4', true))).toBe('ignored');
    expect(await ordersOf('shop-4')).toEqual([]);
  });
});
