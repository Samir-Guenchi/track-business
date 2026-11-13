import type { Order } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import { exchangeAmount, initialExchangeDraft, toExchangeRequest } from './exchange-draft';

const order = {
  shippingFee: 400,
  items: [
    { id: 'i1', name: 'Robe - M', quantity: 2 },
    { id: 'i2', name: 'Ceinture', quantity: 1 },
  ],
} as unknown as Order;

describe('exchange draft', () => {
  it('starts with nothing ticked when the order has several items', () => {
    const draft = initialExchangeDraft(order);
    expect(draft.lines.map((line) => line.selected)).toEqual([false, false]);
    expect(toExchangeRequest(draft)).toBeNull();
  });

  it("adds the customer's wanted size to each replacement", () => {
    const draft = initialExchangeDraft(order, 'taille L');
    expect(draft.lines.map((line) => line.replacement)).toEqual([
      'Robe - M - taille L',
      'Ceinture - taille L',
    ]);
  });

  it('sends the ticked lines and computes what the courier collects', () => {
    const start = initialExchangeDraft(order);
    const draft = {
      ...start,
      lines: start.lines.map((line, index) =>
        index === 0
          ? {
              ...line,
              selected: true,
              quantity: 1,
              replacement: ' Robe - L ',
              priceDifference: 300,
            }
          : line,
      ),
    };
    expect(toExchangeRequest(draft)).toEqual({
      lines: [{ itemId: 'i1', quantity: 1, replacement: 'Robe - L', priceDifference: 300 }],
      deliveryPaidBy: 'customer',
      shippingFee: 400,
    });
    expect(exchangeAmount(draft)).toBe(700);
    expect(exchangeAmount({ ...draft, deliveryPaidBy: 'store' })).toBe(300);
  });
});
