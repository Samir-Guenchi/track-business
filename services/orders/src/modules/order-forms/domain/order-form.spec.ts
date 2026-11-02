import { describe, expect, it } from 'vitest';
import { newFormKey, offeredPrices } from './order-form.js';

describe('order form', () => {
  it('makes 22-character url-safe keys that differ each time', () => {
    const key = newFormKey();
    expect(key).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(newFormKey()).not.toBe(key);
  });

  it('offers only priced delivery types the form allows', () => {
    const prices = [
      { wilayaCode: 16, deliveryType: 'home' as const, price: 400 },
      { wilayaCode: 16, deliveryType: 'stopdesk' as const, price: 250 },
      { wilayaCode: 33, deliveryType: 'home' as const, price: null },
    ];
    expect(offeredPrices(prices, ['home'])).toEqual([
      { wilayaCode: 16, deliveryType: 'home', price: 400 },
    ]);
  });
});
