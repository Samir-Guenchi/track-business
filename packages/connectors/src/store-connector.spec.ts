import { describe, expect, it } from 'vitest';
import { ConnectorRegistry, UnknownConnectorError } from './connector-registry.js';
import { ConnectorError, connectorErrorKind } from './connector.errors.js';
import type { ExternalOrder } from './connector.types.js';
import { FakeConnector } from './testing/fake-connector.js';

const ctx = { storeId: 's1', shopUrl: 'demo.myshopify.com', credentials: { token: 'good' } };
const order = (externalId: string, updatedAt: string): ExternalOrder => ({
  externalId,
  name: `#${externalId}`,
  createdAt: new Date(updatedAt),
  updatedAt: new Date(updatedAt),
  currency: 'DZD',
  customer: {
    name: 'Client',
    phone: null,
    address: null,
    city: null,
    province: 'Alger',
    zip: null,
  },
  items: [{ name: 'Item', sku: null, quantity: 1, unitPrice: 2500 }],
  shippingFee: 400,
  discount: 0,
  note: null,
  cancelled: false,
});

describe('ConnectorRegistry', () => {
  it('finds connectors by code and refuses unknown ones', () => {
    const registry = new ConnectorRegistry([new FakeConnector('shopify')]);

    expect(registry.get('shopify').name).toBe('Fake shop');
    expect(() => registry.get('youcan')).toThrow(UnknownConnectorError);
    expect(registry.list()).toHaveLength(1);
  });
});

describe('ConnectorError', () => {
  it('retries only rate limits and outages', () => {
    expect(connectorErrorKind(429)).toBe('rate_limited');
    expect(new ConnectorError('unavailable', 'down').retryable).toBe(true);
    expect(new ConnectorError(connectorErrorKind(401), 'no').retryable).toBe(false);
  });
});

describe('FakeConnector', () => {
  it('pages through orders changed since a date', async () => {
    const shop = new FakeConnector();
    shop.orders = ['1', '2', '3', '4'].map((id) => order(id, `2026-10-0${id}T00:00:00Z`));
    const since = new Date('2026-10-02T00:00:00Z');

    const first = await shop.listOrders(ctx, { since, cursor: null });
    const second = await shop.listOrders(ctx, { since, cursor: first.nextCursor });

    expect(first.orders.map((o) => o.externalId)).toEqual(['2', '3']);
    expect(second).toMatchObject({ nextCursor: null, orders: [{ externalId: '4' }] });
  });

  it('checks webhook signatures and credentials', async () => {
    const shop = new FakeConnector();
    const rawBody = JSON.stringify([order('9', '2026-10-09T00:00:00Z')]);

    const parsed = await shop.parseWebhook(ctx, {
      headers: { 'x-fake-signature': 'good' },
      rawBody,
    });
    expect(parsed[0]?.createdAt).toBeInstanceOf(Date);
    await expect(shop.parseWebhook(ctx, { headers: {}, rawBody })).rejects.toMatchObject({
      kind: 'auth',
    });
    await expect(shop.validate({ ...ctx, credentials: { token: 'bad' } })).rejects.toMatchObject({
      kind: 'auth',
    });
  });

  it('records each fulfilment once', async () => {
    const shop = new FakeConnector();
    shop.orders = [order('1', '2026-10-01T00:00:00Z')];
    const fulfilment = {
      externalId: '1',
      carrierName: 'Yalidine',
      trackingNumber: 'yal-1',
      trackingUrl: 'https://t.example/x',
    };

    await shop.pushFulfilment(ctx, fulfilment);
    await shop.pushFulfilment(ctx, fulfilment);

    expect(shop.fulfilments).toHaveLength(1);
  });
});
