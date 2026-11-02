import { describe, expect, it } from 'vitest';
import { fillPriceGrid, quoteShipping, unknownCodes } from './shipping-quote.js';

describe('quoteShipping', () => {
  it('charges the store price below the free shipping threshold', () => {
    expect(quoteShipping({ price: 600, freeShippingFrom: 10_000, subtotal: 9_999 })).toEqual({
      available: true,
      fee: 600,
      freeShippingApplied: false,
    });
  });

  it('ships for free once the subtotal reaches the threshold', () => {
    expect(quoteShipping({ price: 600, freeShippingFrom: 10_000, subtotal: 10_000 })).toEqual({
      available: true,
      fee: 0,
      freeShippingApplied: true,
    });
  });

  it('is not available when the store set no price', () => {
    expect(quoteShipping({ price: null, freeShippingFrom: 0, subtotal: 50_000 })).toEqual({
      available: false,
      fee: null,
      freeShippingApplied: false,
    });
  });

  it('ignores the rule when it is off', () => {
    expect(quoteShipping({ price: 400, freeShippingFrom: null, subtotal: 1e6 }).fee).toBe(400);
  });
});

describe('fillPriceGrid', () => {
  it('returns every wilaya and both delivery types in code order', () => {
    const grid = fillPriceGrid(
      [31, 16],
      [{ wilayaCode: 16, deliveryType: 'stopdesk', price: 350 }],
    );

    expect(grid).toEqual([
      { wilayaCode: 16, deliveryType: 'home', price: null },
      { wilayaCode: 16, deliveryType: 'stopdesk', price: 350 },
      { wilayaCode: 31, deliveryType: 'home', price: null },
      { wilayaCode: 31, deliveryType: 'stopdesk', price: null },
    ]);
  });
});

describe('unknownCodes', () => {
  it('lists codes that are not current wilayas once each', () => {
    expect(unknownCodes([70, 16, 70, 0], new Set([16]))).toEqual([0, 70]);
  });
});
