import { describe, expect, it } from 'vitest';
import { ShippingQuoteQuerySchema, UpdateStorePricesRequestSchema } from './pricing.schema.js';

describe('pricing contract', () => {
  it('reads the quote query string', () => {
    const query = ShippingQuoteQuerySchema.parse({ wilayaCode: '59', deliveryType: 'stopdesk' });

    expect(query).toEqual({ wilayaCode: 59, deliveryType: 'stopdesk', subtotal: 0 });
  });

  it('accepts null to stop delivering somewhere and rejects fractional prices', () => {
    const ok = { items: [{ wilayaCode: 11, deliveryType: 'home', price: null }] };
    const bad = { items: [{ wilayaCode: 11, deliveryType: 'home', price: 450.5 }] };

    expect(UpdateStorePricesRequestSchema.safeParse(ok).success).toBe(true);
    expect(UpdateStorePricesRequestSchema.safeParse(bad).success).toBe(false);
  });
});
