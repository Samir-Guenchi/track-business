import { describe, expect, it } from 'vitest';
import type { OrderRecord } from '../../orders/domain/order.js';
import { exchangeRefusal, planExchange } from './exchange.js';

const order = {
  status: 'delivered',
  items: [
    {
      id: 'i1',
      productId: 'p1',
      name: 'Robe - M',
      sku: null,
      quantity: 2,
      unitPrice: 3000,
      lineTotal: 6000,
    },
    {
      id: 'i2',
      productId: null,
      name: 'Ceinture',
      sku: null,
      quantity: 1,
      unitPrice: 800,
      lineTotal: 800,
    },
  ],
} as unknown as OrderRecord;
const line = (itemId: string, quantity: number, priceDifference = 0) => ({
  itemId,
  quantity,
  replacement: 'Robe - L',
  priceDifference,
});

describe('exchange rules', () => {
  it('needs a delivered order and items the customer has', () => {
    expect(exchangeRefusal(order, [line('i1', 2)])).toBeNull();
    expect(exchangeRefusal({ ...order, status: 'shipped' }, [line('i1', 1)])).toBe('not_delivered');
    expect(exchangeRefusal(order, [line('nope', 1)])).toBe('unknown_item');
    expect(exchangeRefusal(order, [line('i1', 1), line('i1', 2)])).toBe('too_many');
  });

  it('charges the price difference and the trip when the customer pays it', () => {
    const plan = planExchange(order, {
      lines: [line('i1', 1, 500), line('i2', 1)],
      deliveryPaidBy: 'customer',
      shippingFee: 400,
    });
    expect(plan.items).toEqual([
      { productId: 'p1', name: 'Robe - L', quantity: 1, unitPrice: 500 },
      { name: 'Robe - L', quantity: 1, unitPrice: 0 },
    ]);
    expect(plan.collect).toBe('1 x Robe - M, 1 x Ceinture');
    expect(plan.shippingFee).toBe(400);
    const free = planExchange(order, {
      lines: [line('i1', 1)],
      deliveryPaidBy: 'store',
      shippingFee: 400,
    });
    expect(free.shippingFee).toBe(0);
  });
});
