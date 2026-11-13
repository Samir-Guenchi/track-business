import type { Reseller, ResellerStats } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import { summariseResellers } from './reseller-summary';

const stats = (overrides: Partial<ResellerStats> = {}): ResellerStats => ({
  orders: 0,
  delivered: 0,
  returned: 0,
  deliveryRate: null,
  marginPending: 0,
  marginEarned: 0,
  marginPaid: 0,
  ...overrides,
});

const reseller = (
  id: string,
  active: boolean,
  overrides: Partial<ResellerStats> = {},
): Reseller => ({
  id,
  name: `Reseller ${id}`,
  phone: '0550000000',
  portalCode: 'code',
  active,
  stats: stats(overrides),
});

describe('summariseResellers', () => {
  it('returns zeroes and no rate for an empty store', () => {
    expect(summariseResellers([])).toEqual({
      count: 0,
      active: 0,
      orders: 0,
      delivered: 0,
      returned: 0,
      finalOrders: 0,
      deliveryRate: null,
      marginPending: 0,
      marginEarned: 0,
    });
  });

  it('sums orders, margins and active resellers', () => {
    const summary = summariseResellers([
      reseller('a', true, { orders: 4, marginPending: 800, marginEarned: 300 }),
      reseller('b', false, { orders: 2, marginPending: 200, marginEarned: 100 }),
    ]);
    expect(summary).toMatchObject({
      count: 2,
      active: 1,
      orders: 6,
      marginPending: 1000,
      marginEarned: 400,
    });
  });

  it('weights the delivery rate by final orders, not by reseller', () => {
    const summary = summariseResellers([
      reseller('a', true, { delivered: 9, returned: 1, deliveryRate: 0.9 }),
      reseller('b', true, { delivered: 0, returned: 10, deliveryRate: 0 }),
    ]);
    expect(summary.finalOrders).toBe(20);
    expect(summary.deliveryRate).toBe(0.45);
  });

  it('ignores orders that are still on the way', () => {
    const summary = summariseResellers([reseller('a', true, { orders: 7 })]);
    expect(summary.deliveryRate).toBeNull();
    expect(summary.finalOrders).toBe(0);
  });
});
