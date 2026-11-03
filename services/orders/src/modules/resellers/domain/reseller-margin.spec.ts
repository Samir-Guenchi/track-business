import type { ResellerProduct } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import { deliveryRate, marginState, newPortalCode, priceItems } from './reseller-margin.js';

const robe: ResellerProduct = {
  id: '19800000-0000-4000-8000-000000000001',
  name: 'Robe',
  supplierPrice: 2500,
  minPrice: 3000,
  active: true,
};

describe('marginState', () => {
  it('is owed only once delivered, and never on a return', () => {
    expect(marginState('shipped', null)).toBe('pending');
    expect(marginState('delivered', null)).toBe('earned');
    expect(marginState('delivered', new Date())).toBe('paid');
    expect(marginState('returned', null)).toBe('void');
  });
});

describe('priceItems', () => {
  it('adds the margin of every unit', () => {
    const priced = priceItems([robe], [{ productId: robe.id, quantity: 2, sellingPrice: 3500 }]);
    expect(priced).toMatchObject({ subtotal: 7000, margin: 2000 });
    expect(priced.items[0]).toEqual({
      productId: robe.id,
      name: 'Robe',
      quantity: 2,
      unitPrice: 3500,
    });
  });

  it('refuses a price under the minimum and unknown or paused products', () => {
    expect(() =>
      priceItems([robe], [{ productId: robe.id, quantity: 1, sellingPrice: 2800 }]),
    ).toThrow(/3000/);
    const paused = { ...robe, active: false };
    expect(() =>
      priceItems([paused], [{ productId: robe.id, quantity: 1, sellingPrice: 3500 }]),
    ).toThrow(/not offered/);
  });
});

describe('helpers', () => {
  it('makes long random portal codes and a delivery rate', () => {
    expect(newPortalCode()).toMatch(/^[A-Za-z0-9_-]{24}$/);
    expect(deliveryRate(0, 0)).toBeNull();
    expect(deliveryRate(3, 1)).toBe(0.75);
  });
});
