import { describe, expect, it } from 'vitest';
import { permissionToSet } from './order.js';
import { InvalidAmountError } from './order.errors.js';
import { itemsFingerprint, newOrderRef } from './order-identity.js';
import { computeTotals } from './order-pricing.js';

describe('computeTotals', () => {
  it('collects items + shipping - discount', () => {
    const totals = computeTotals(
      [
        { quantity: 2, unitPrice: 1500 },
        { quantity: 1, unitPrice: 900 },
      ],
      600,
      400,
    );

    expect(totals).toEqual({ lineTotals: [3000, 900], subtotal: 3900, codAmount: 4100 });
  });

  it('refuses a discount larger than the order', () => {
    expect(() => computeTotals([{ quantity: 1, unitPrice: 100 }], 0, 200)).toThrow(
      InvalidAmountError,
    );
  });
});

describe('itemsFingerprint', () => {
  it('ignores item order and name case', () => {
    const a = itemsFingerprint([
      { name: 'Robe', quantity: 1 },
      { name: 'Foulard', quantity: 2 },
    ]);
    const b = itemsFingerprint([
      { name: 'foulard ', quantity: 2 },
      { name: 'ROBE', quantity: 1 },
    ]);

    expect(a).toBe(b);
  });

  it('changes with the quantity', () => {
    expect(itemsFingerprint([{ name: 'Robe', quantity: 1 }])).not.toBe(
      itemsFingerprint([{ name: 'Robe', quantity: 2 }]),
    );
  });
});

describe('newOrderRef', () => {
  it('uses easy-to-dictate characters only', () => {
    expect(newOrderRef()).toMatch(/^TE-[0-9A-HJKMNP-TV-Z]{6}$/);
  });
});

describe('permissionToSet', () => {
  it('lets agents confirm and packers ship', () => {
    expect(permissionToSet('confirmed')).toBe('orders.confirm');
    expect(permissionToSet('postponed')).toBe('orders.confirm');
    expect(permissionToSet('shipped')).toBe('shipments.manage');
  });
});
