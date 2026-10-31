import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { EventTypeSchema, eventEnvelope } from './envelope.schema.js';

const anEnvelope = (overrides: Record<string, unknown> = {}) => ({
  id: 'evt_1',
  type: 'orders.order.confirmed.v1',
  occurredAt: '2026-10-31T12:00:00Z',
  storeId: 'store_1',
  correlationId: 'corr_1',
  data: { orderId: 'ord_1' },
  ...overrides,
});

describe('EventTypeSchema', () => {
  it.each(['orders.order.confirmed.v1', 'shipping.parcel.delivered.v2'])('accepts %s', (type) => {
    expect(EventTypeSchema.safeParse(type).success).toBe(true);
  });

  it.each(['orderConfirmed', 'orders.order.confirmed'])('rejects %s', (type) => {
    expect(EventTypeSchema.safeParse(type).success).toBe(false);
  });
});

describe('eventEnvelope', () => {
  const schema = eventEnvelope(z.strictObject({ orderId: z.string() }));

  it('parses a valid envelope', () => {
    expect(schema.parse(anEnvelope()).data.orderId).toBe('ord_1');
  });

  it('rejects an envelope without a store', () => {
    expect(schema.safeParse(anEnvelope({ storeId: undefined })).success).toBe(false);
  });
});
