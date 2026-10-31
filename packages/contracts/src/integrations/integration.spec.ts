import { describe, expect, it } from 'vitest';
import { ConnectorCodeSchema, IntegrationSchema } from './integration.schema.js';

describe('integrations contract', () => {
  it('knows the three shop platforms', () => {
    expect(ConnectorCodeSchema.options).toEqual(['shopify', 'woocommerce', 'youcan']);
  });

  it('describes a shop that needs reconnecting', () => {
    const row = {
      connector: 'shopify',
      shopUrl: 'demo-shop.myshopify.com',
      shopName: 'Demo shop',
      status: 'needs_reconnect',
      lastSyncAt: null,
      ordersImported: 0,
      lastError: 'connector.auth',
    };

    expect(IntegrationSchema.parse(row)).toEqual(row);
  });
});
