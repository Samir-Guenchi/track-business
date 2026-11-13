import { describe, expect, it } from 'vitest';
import { fillPriceGrid, quoteShipping, unknownCodes } from './shipping-quote.js';

const rule = (freeShippingFrom: number | null, excluded: number[] = []) => ({
  freeShippingFrom,
  freeShippingExcludedWilayas: excluded,
});
const quote = (price: number | null, from: number | null, subtotal: number) =>
  quoteShipping({ price, rule: rule(from), wilayaCode: 16, subtotal });

describe('quoteShipping', () => {
  it('charges the store price below the free shipping threshold', () => {
    expect(quote(600, 10_000, 9_999)).toEqual({
      available: true,
      fee: 600,
      freeShippingApplied: false,
    });
  });

  it('ships for free once the subtotal reaches the threshold', () => {
    expect(quote(600, 10_000, 10_000)).toEqual({
      available: true,
      fee: 0,
      freeShippingApplied: true,
    });
  });

  it('is not available when the store set no price', () => {
    expect(quote(null, 0, 50_000)).toEqual({
      available: false,
      fee: null,
      freeShippingApplied: false,
    });
  });

  it('ignores the rule when it is off', () => {
    expect(quote(400, null, 1e6).fee).toBe(400);
  });
});

describe('quoteShipping with excluded wilayas', () => {
  it('keeps charging delivery to a far wilaya above the threshold', () => {
    const far = quoteShipping({
      price: 1200,
      rule: rule(8_000, [11]),
      wilayaCode: 11,
      subtotal: 9e3,
    });
    expect(far).toEqual({ available: true, fee: 1200, freeShippingApplied: false });
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
