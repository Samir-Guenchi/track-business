import { execFileSync } from 'node:child_process';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { INTEGRATION_EVENTS, OrderReceivedEventSchema } from '@trackecom/contracts';
import { ConnectorError } from '@trackecom/connectors';
import type { FakeConnector } from '@trackecom/connectors/testing';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { type FakeGeo, startFakeGeo } from '../../test/fake-geo.js';
import { shopOrder, withCustomer } from '../../test/shop-order.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { ConnectionsService } from '../connections/application/connections.service.js';
import { FAKE_CONNECTOR } from '../connections/infrastructure/connectors.providers.js';
import { ShopSync } from './application/shop-sync.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '47474747-4747-4747-8747-000000000047';

describe.skipIf(!baseUrl || !redisUrl)('shop order sync (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=integrations_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let geo: FakeGeo;
  let prisma: PrismaService;
  let shop: FakeConnector;
  let sync: ShopSync;

  const events = async () =>
    (
      await prisma.outboxEvent.findMany({
        where: { type: INTEGRATION_EVENTS.orderReceived },
        orderBy: { occurredAt: 'asc' },
      })
    ).map((row) => OrderReceivedEventSchema.parse((row.payload as { data: unknown }).data));
  const runAgain = async () => {
    await prisma.shopConnection.updateMany({ data: { lastSyncAt: null } });
    return sync.runOnce();
  };

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({});
    geo = await startFakeGeo();
    const env = { DATABASE_URL: databaseUrl, REDIS_URL: redisUrl, IDENTITY_URL: identity.url };
    app = await startTestApp(testEnv({ ...env, SHIPPING_URL: geo.url }));
    prisma = app.get(PrismaService);
    shop = app.get(FAKE_CONNECTOR);
    sync = app.get(ShopSync);
  });

  beforeEach(async () => {
    await prisma.outboxEvent.deleteMany();
    await prisma.shopConnection.deleteMany();
    shop.orders = [];
    await app.get(ConnectionsService).connect(STORE, {
      connector: 'woocommerce',
      shopUrl: 'https://sync.example',
      credentials: { token: 'good' },
    });
  });

  afterAll(async () => {
    await app?.close();
    await geo?.close();
    await identity?.close();
  });

  it('backfills placed orders once and holds the others back with their problem', async () => {
    shop.orders = [
      shopOrder('1'),
      withCustomer('2', { province: 'Paris' }),
      shopOrder('3', { currency: 'EUR' }),
    ];

    expect(await sync.runOnce()).toBe(1);
    expect(await sync.runOnce()).toBe(0);
    await runAgain();

    const sent = await events();
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      externalId: '1',
      order: { customer: { wilayaCode: 16, communeId: 1621 } },
    });
    const ledger = await prisma.importedOrder.findMany({ orderBy: { externalId: 'asc' } });
    expect(ledger.map((row) => [row.state, row.problem])).toEqual([
      ['sent', null],
      ['needs_fix', 'address'],
      ['needs_fix', 'currency'],
    ]);
    expect(ledger[1]?.pending).not.toBeNull();
    const connection = await prisma.shopConnection.findFirstOrThrow();
    expect(connection).toMatchObject({ ordersImported: 1, status: 'connected', lastError: null });
  });

  it('sends a cancellation only for an order it sent', async () => {
    shop.orders = [shopOrder('1')];
    await sync.runOnce();
    const later = new Date(Date.now() + 60_000);
    shop.orders = [
      shopOrder('1', { cancelled: true, updatedAt: later }),
      shopOrder('9', { cancelled: true, updatedAt: later }),
    ];

    await runAgain();

    expect((await events()).map((event) => [event.externalId, event.cancelled])).toEqual([
      ['1', false],
      ['1', true],
    ]);
  });

  it('asks the seller to reconnect when the shop refuses the token', async () => {
    vi.spyOn(shop, 'listOrders').mockRejectedValueOnce(new ConnectorError('auth', 'revoked'));

    await sync.runOnce();

    expect(await prisma.shopConnection.findFirstOrThrow()).toMatchObject({
      status: 'needs_reconnect',
      lastError: 'connector.auth',
    });
    expect(await runAgain()).toBe(0);
  });
});
