import { describe, expect, it } from 'vitest';
import { CreateExchangeRequestSchema } from './exchange.schema.js';

describe('CreateExchangeRequestSchema', () => {
  it('defaults the price difference to a plain swap', () => {
    const request = CreateExchangeRequestSchema.parse({
      lines: [{ itemId: 'i1', quantity: 1, replacement: 'Robe - taille L' }],
      deliveryPaidBy: 'customer',
      shippingFee: 400,
    });
    expect(request.lines[0]?.priceDifference).toBe(0);
  });

  it('needs at least one line', () => {
    const empty = { lines: [], deliveryPaidBy: 'store', shippingFee: 0 };
    expect(CreateExchangeRequestSchema.safeParse(empty).success).toBe(false);
  });
});
