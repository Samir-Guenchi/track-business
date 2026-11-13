import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { type EventEnvelope, SHIPMENT_EVENTS } from '@trackecom/contracts';
import { ConnectorError } from '@trackecom/connectors';
import type { FakeConnector } from '@trackecom/connectors/testing';
import { type FakeIdentity, startFakeIdentity } from '@trackecom/service-kit/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { type FakeGeo, startFakeGeo } from '../../test/fake-geo.js';
import { type FakeOrders, startFakeOrders } from '../../test/fake-orders.js';
import { shopOrder } from '../../test/shop-order.js';
import { startTestApp, testEnv } from '../../test/test-app.js';
import { ConnectionsService } from '../connections/application/connections.service.js';
import { FAKE_CONNECTOR } from '../connections/infrastructure/connectors.providers.js';
import { OrderImporter } from '../sync/application/order-importer.js';
import { PushFulfilmentUseCase } from './application/push-fulfilment.use-case.js';

const baseUrl = process.env['TEST_DATABASE_URL'];
const redisUrl = process.env['TEST_REDIS_URL'];
const STORE = '49494949-4949-4949-8949-000000000049';
const TOKEN = 'test-internal-token-0123456789abcdef';
const FROM_SHOP = 'f0000000-0000-4000-8000-000000000001';
const MANUAL = 'f0000000-0000-4000-8000-000000000002';

const created = (orderId: string): EventEnvelope => ({
  id: randomUUID(),
  type: SHIPMENT_EVENTS.created,
  occurredAt: new Date().toISOString(),
  storeId: STORE,
  correlationId: randomUUID(),
  data: {
    shipmentId: randomUUID(),
    orderId,
    reference: 'TE-1-v1',
    carrier: 'yalidine',
    trackingNumber: 'yal-TEST49',
    publicCode: 'pUbLiCcOdE49',
    labelUrl: null,
    codAmount: 3100,
  },
});

describe.skipIf(!baseUrl || !redisUrl)('tracking back to the shop (real Postgres)', () => {
  const databaseUrl = `${baseUrl}?schema=integrations_test`;
  let app: NestFastifyApplication;
  let identity: FakeIdentity;
  let geo: FakeGeo;
  let orders: FakeOrders;
  let prisma: PrismaService;
  let shop: FakeConnector;
  let push: PushFulfilmentUseCase;

  beforeAll(async () => {
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
    identity = await startFakeIdentity({});
    geo = await startFakeGeo();
    orders = await startFakeOrders(TOKEN, {
      [FROM_SHOP]: { source: 'woocommerce', externalRef: 'f1' },
      [MANUAL]: { source: 'manual', externalRef: null },
    });
    app = await startTestApp(
      testEnv({
        DATABASE_URL: databaseUrl,
        REDIS_URL: redisUrl,
        IDENTITY_URL: identity.url,
        SHIPPING_URL: geo.url,
        ORDERS_URL: orders.url,
        INTERNAL_TOKEN: TOKEN,
        TRACKING_URL: 'https://track.example/t/',
      }),
    );
    prisma = app.get(PrismaService);
    shop = app.get(FAKE_CONNECTOR);
    push = app.get(PushFulfilmentUseCase);
  });

  beforeEach(async () => {
    await prisma.processedEvent.deleteMany();
    await prisma.shopConnection.deleteMany();
    shop.fulfilments.length = 0;
    const connection = await app.get(ConnectionsService).connect(STORE, {
      connector: 'woocommerce',
      shopUrl: 'https://fulfil.example',
      credentials: { token: 'good' },
    });
    shop.orders = [shopOrder('f1')];
    await app.get(OrderImporter).import(connection, shop.orders);
  });

  afterAll(async () => {
    await app?.close();
    await orders?.close();
    await geo?.close();
    await identity?.close();
  });

  it('gives the shop our tracking link once, even when the event comes twice', async () => {
    const event = created(FROM_SHOP);

    expect(await push.execute(event)).toBe('pushed');
    expect(await push.execute(event)).toBe('duplicate');
    expect(shop.fulfilments).toEqual([
      {
        externalId: 'f1',
        carrierName: 'yalidine',
        trackingNumber: 'yal-TEST49',
        trackingUrl: 'https://track.example/t/pUbLiCcOdE49',
      },
    ]);
  });

  it('leaves orders that did not come from a shop alone', async () => {
    expect(await push.execute(created(MANUAL))).toBe('not_from_shop');
    expect(await push.execute(created(randomUUID()))).toBe('not_from_shop');
    expect(shop.fulfilments).toEqual([]);
  });

  it('retries an outage but flags a refused token for reconnecting', async () => {
    const event = created(FROM_SHOP);
    const pushSpy = vi.spyOn(shop, 'pushFulfilment');
    pushSpy.mockRejectedValueOnce(new ConnectorError('unavailable', 'down'));

    await expect(push.execute(event)).rejects.toThrow('down');
    pushSpy.mockRejectedValueOnce(new ConnectorError('auth', 'revoked'));
    expect(await push.execute(event)).toBe('reconnect');
    expect(await prisma.shopConnection.findFirstOrThrow()).toMatchObject({
      status: 'needs_reconnect',
    });
    pushSpy.mockRestore();
  });
});
