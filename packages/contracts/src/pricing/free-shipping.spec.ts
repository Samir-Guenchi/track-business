import { describe, expect, it } from 'vitest';
import { freeShippingApplies } from './pricing.schema.js';

const rule = { freeShippingFrom: 8_000, freeShippingExcludedWilayas: [11, 33] };

describe('freeShippingApplies', () => {
  it('applies from the threshold', () => {
    expect(freeShippingApplies(rule, { wilayaCode: 16, subtotal: 8_000 })).toBe(true);
    expect(freeShippingApplies(rule, { wilayaCode: 16, subtotal: 7_999 })).toBe(false);
  });

  it('never applies in an excluded wilaya', () => {
    expect(freeShippingApplies(rule, { wilayaCode: 11, subtotal: 50_000 })).toBe(false);
  });

  it('is off without a threshold', () => {
    const off = { freeShippingFrom: null, freeShippingExcludedWilayas: [] };
    expect(freeShippingApplies(off, { wilayaCode: 16, subtotal: 1e6 })).toBe(false);
  });
});
