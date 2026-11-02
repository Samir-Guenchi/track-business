import { describe, expect, it } from 'vitest';
import { ConnectorCodeSchema, IntegrationSchema } from './integration.schema.js';

describe('integrations contract', () => {
  it('knows the shop platforms and Google Sheets', () => {
    expect(ConnectorCodeSchema.options).toEqual([
      'shopify',
      'woocommerce',
      'youcan',
      'google_sheets',
    ]);
  });

  it('describes a shop that needs reconnecting', () => {
    const row = {
      id: '11111111-1111-4111-8111-111111111111',
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
