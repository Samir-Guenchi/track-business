import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ConnectorError } from '../connector.errors.js';
import { ShopifyConnector } from './shopify.connector.js';

const ctx = {
  storeId: 's1',
  shopUrl: 'https://test-shop.myshopify.com/',
  credentials: { accessToken: 'shpat_test', webhookSecret: 'app-secret' },
};

interface Call {
  readonly url: string;
  readonly body: { query: string; variables: Record<string, unknown> };
  readonly token: string | null;
}

/** Answers each GraphQL call with the next queued body. */
function fakeShopify(...answers: unknown[]) {
  const calls: Call[] = [];
  const fetch = (url: string, init: RequestInit) => {
    const headers = new Headers(init.headers);
    calls.push({
      url,
      body: JSON.parse(String(init.body)),
      token: headers.get('x-shopify-access-token'),
    });
    const answer = answers.shift();
    if (answer instanceof Response) return Promise.resolve(answer);
    return Promise.resolve(Response.json(answer));
  };
  return { connector: new ShopifyConnector({ fetch }), calls };
}

const graphqlOrder = {
  legacyResourceId: '5550001',
  name: '#1042',
  createdAt: '2026-11-01T09:00:00Z',
  updatedAt: '2026-11-01T09:05:00Z',
  currencyCode: 'DZD',
  cancelledAt: null,
  note: 'Appeler le soir',
  phone: null,
  totalDiscountsSet: { shopMoney: { amount: '200.00' } },
  totalShippingPriceSet: { shopMoney: { amount: '600.00' } },
  customer: { phone: '+213555000470' },
  shippingAddress: {
    name: 'Client Test',
    phone: null,
    address1: 'Rue des tests',
    address2: 'Bt 3',
    city: 'Bab Ezzouar',
    province: 'Alger',
    provinceCode: 'DZ-16',
    zip: '16024',
  },
  lineItems: {
    nodes: [
      {
        title: 'Robe',
        sku: 'R-1',
        quantity: 2,
        originalUnitPriceSet: { shopMoney: { amount: '2500.00' } },
      },
    ],
  },
};

describe('ShopifyConnector', () => {
  it('reads the shop with the access token on the shop domain only', async () => {
    const { connector, calls } = fakeShopify({
      data: { shop: { name: 'Test Shop', currencyCode: 'DZD' } },
    });

    expect(await connector.validate(ctx)).toEqual({ name: 'Test Shop', currency: 'DZD' });
    expect(calls[0]?.url).toBe('https://test-shop.myshopify.com/admin/api/2025-07/graphql.json');
    expect(calls[0]?.token).toBe('shpat_test');
    await expect(
      connector.validate({ ...ctx, shopUrl: 'https://evil.example/x' }),
    ).rejects.toMatchObject({
      kind: 'validation',
    });
  });

  it('pages orders updated since a date and maps them', async () => {
    const page = { pageInfo: { hasNextPage: true, endCursor: 'c2' }, nodes: [graphqlOrder] };
    const { connector, calls } = fakeShopify({ data: { orders: page } });

    const result = await connector.listOrders(ctx, {
      since: new Date('2026-10-02T00:00:00Z'),
      cursor: null,
    });

    expect(calls[0]?.body.variables).toMatchObject({
      query: "updated_at:>='2026-10-02T00:00:00.000Z'",
      after: null,
    });
    expect(result.nextCursor).toBe('c2');
    expect(result.orders[0]).toMatchObject({
      externalId: '5550001',
      name: '#1042',
      customer: {
        name: 'Client Test',
        phone: '+213555000470',
        address: 'Rue des tests, Bt 3',
        province: 'Alger',
      },
      items: [{ name: 'Robe', sku: 'R-1', quantity: 2, unitPrice: 2500 }],
      shippingFee: 600,
      discount: 200,
      cancelled: false,
    });
  });

  it('turns auth failures and throttling into connector errors', async () => {
    const { connector } = fakeShopify(new Response('', { status: 401 }), {
      errors: [{ message: 'x', extensions: { code: 'THROTTLED' } }],
    });

    await expect(connector.validate(ctx)).rejects.toMatchObject({ kind: 'auth' });
    const throttled = await connector.validate(ctx).catch((error: unknown) => error);
    expect(throttled).toBeInstanceOf(ConnectorError);
    expect((throttled as ConnectorError).retryable).toBe(true);
  });

  describe('webhooks', () => {
    const body = JSON.stringify({
      id: 5550002,
      name: '#1043',
      created_at: '2026-11-01T10:00:00Z',
      updated_at: '2026-11-01T10:00:00Z',
      currency: 'DZD',
      cancelled_at: null,
      note: null,
      phone: '+213555000471',
      total_discounts: '0.00',
      total_shipping_price_set: { shop_money: { amount: '400.00' } },
      shipping_address: {
        name: 'Autre Client',
        phone: null,
        address1: 'Cité 5 juillet',
        address2: null,
        city: 'Oran',
        province: 'Oran',
        province_code: 'DZ-31',
        zip: null,
      },
      line_items: [{ title: 'Sac', sku: null, quantity: 1, price: '3200.00' }],
    });
    const signed = (secret: string) => createHmac('sha256', secret).update(body).digest('base64');

    it('accepts a signed order webhook', async () => {
      const { connector } = fakeShopify();
      const headers = {
        'x-shopify-hmac-sha256': signed('app-secret'),
        'x-shopify-topic': 'orders/create',
      };

      const [order] = await connector.parseWebhook(ctx, { headers, rawBody: body });

      expect(order).toMatchObject({
        externalId: '5550002',
        customer: { phone: '+213555000471', city: 'Oran' },
        shippingFee: 400,
      });
      expect(order?.items).toEqual([{ name: 'Sac', sku: null, quantity: 1, unitPrice: 3200 }]);
    });

    it('refuses a bad signature and ignores other topics', async () => {
      const { connector } = fakeShopify();
      const forged = {
        'x-shopify-hmac-sha256': signed('other'),
        'x-shopify-topic': 'orders/create',
      };
      await expect(
        connector.parseWebhook(ctx, { headers: forged, rawBody: body }),
      ).rejects.toMatchObject({ kind: 'auth' });

      const other = {
        'x-shopify-hmac-sha256': signed('app-secret'),
        'x-shopify-topic': 'products/update',
      };
      expect(await connector.parseWebhook(ctx, { headers: other, rawBody: body })).toEqual([]);
    });
  });

  describe('pushFulfilment', () => {
    const fulfilment = {
      externalId: '5550001',
      carrierName: 'Yalidine',
      trackingNumber: 'yal-1',
      trackingUrl: 'https://t.example/abc',
    };

    it('fulfils the open fulfillment orders with our tracking', async () => {
      const state = {
        order: {
          fulfillments: [],
          fulfillmentOrders: {
            nodes: [
              { id: 'gid://shopify/FulfillmentOrder/1', status: 'OPEN' },
              { id: 'gid://shopify/FulfillmentOrder/2', status: 'CLOSED' },
            ],
          },
        },
      };
      const { connector, calls } = fakeShopify(
        { data: state },
        { data: { fulfillmentCreate: { fulfillment: { id: 'f1' }, userErrors: [] } } },
      );

      await connector.pushFulfilment(ctx, fulfilment);

      expect(calls[0]?.body.variables).toEqual({ id: 'gid://shopify/Order/5550001' });
      expect(calls[1]?.body.variables).toEqual({
        fulfillment: {
          lineItemsByFulfillmentOrder: [{ fulfillmentOrderId: 'gid://shopify/FulfillmentOrder/1' }],
          trackingInfo: { number: 'yal-1', url: 'https://t.example/abc', company: 'Yalidine' },
          notifyCustomer: false,
        },
      });
    });

    it('does nothing when this tracking number is already on the order', async () => {
      const state = {
        order: {
          fulfillments: [{ trackingInfo: [{ number: 'yal-1' }] }],
          fulfillmentOrders: { nodes: [] },
        },
      };
      const { connector, calls } = fakeShopify({ data: state });

      await connector.pushFulfilment(ctx, fulfilment);

      expect(calls).toHaveLength(1);
    });
  });
});
