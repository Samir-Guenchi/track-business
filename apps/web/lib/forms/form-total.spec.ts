import type { PublicOrderForm } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import { deliveryOptions, deliversTo, totalsOf, utmFrom } from './form-total';

const form: PublicOrderForm = {
  key: 'abcdefghijklmnopqrstuv',
  title: 'Boutique',
  products: [{ id: 'sac', name: 'Sac', unitPrice: 3000, variants: [] }],
  deliveryTypes: ['home', 'stopdesk'],
  maxQuantity: 5,
  theme: { accent: '#1f5c4a' },
  prices: [
    { wilayaCode: 16, deliveryType: 'home', price: 400 },
    { wilayaCode: 16, deliveryType: 'stopdesk', price: 250 },
  ],
  freeShippingFrom: 9000,
};
const pick = { productId: 'sac', quantity: 1, wilayaCode: 16, deliveryType: 'home' as const };

describe('order form totals', () => {
  it('adds the delivery price of the wilaya and type', () => {
    expect(totalsOf(form, pick)).toEqual({ subtotal: 3000, shippingFee: 400, total: 3400 });
    expect(totalsOf(form, { ...pick, deliveryType: 'stopdesk' }).shippingFee).toBe(250);
  });

  it('ships free from the threshold', () => {
    expect(totalsOf(form, { ...pick, quantity: 3 })).toEqual({
      subtotal: 9000,
      shippingFee: 0,
      total: 9000,
    });
  });

  it('leaves the fee open until a wilaya and type are picked', () => {
    expect(totalsOf(form, { ...pick, wilayaCode: undefined }).shippingFee).toBeNull();
  });

  it('offers only priced wilayas, or all when prices are unknown', () => {
    expect(deliversTo(form, 16)).toBe(true);
    expect(deliversTo(form, 33)).toBe(false);
    const unknown = { ...form, prices: [] };
    expect(deliversTo(unknown, 33)).toBe(true);
    expect(deliveryOptions(unknown, 33)).toEqual([
      { deliveryType: 'home', price: null },
      { deliveryType: 'stopdesk', price: null },
    ]);
  });
});

describe('utmFrom', () => {
  it('keeps only utm parameters that have a value', () => {
    const params = new URLSearchParams('utm_source=facebook&utm_medium=&utm_campaign=ete&x=1');
    expect(utmFrom(params)).toEqual({ source: 'facebook', campaign: 'ete' });
    expect(utmFrom(new URLSearchParams('x=1'))).toBeUndefined();
  });
});
