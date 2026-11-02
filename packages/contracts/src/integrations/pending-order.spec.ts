import { describe, expect, it } from 'vitest';
import { ResolvePendingOrderRequestSchema } from './pending-order.schema.js';

const KEY = { connectionId: '11111111-1111-4111-8111-111111111111', externalId: '1001' };

describe('pending shop orders', () => {
  it('lets the seller place the customer and normalises a corrected phone', () => {
    const parsed = ResolvePendingOrderRequestSchema.parse({
      ...KEY,
      phone: '0555 00 00 01',
      wilayaCode: 16,
      communeId: 1621,
    });

    expect(parsed.phone).toBe('+213555000001');
  });

  it('needs a commune to resolve', () => {
    expect(ResolvePendingOrderRequestSchema.safeParse({ ...KEY, wilayaCode: 16 }).success).toBe(
      false,
    );
  });
});
