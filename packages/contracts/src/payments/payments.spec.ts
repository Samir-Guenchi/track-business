import { describe, expect, it } from 'vitest';
import { EVENT_TYPE_PATTERN } from '../events/envelope.schema.js';
import { PAYMENT_EVENTS } from './payment-events.js';
import { ImportPayoutRequestSchema, PayoutStatusSchema } from './payout.schema.js';
import { MoneySettingsSchema } from './reconciliation.schema.js';

const line = { trackingNumber: 'yal-1', codAmount: 3100, shippingFee: 500, returnFee: 0 };

describe('payments contract', () => {
  it.each(Object.values(PAYMENT_EVENTS))('names %s by the event convention', (type) => {
    expect(type).toMatch(EVENT_TYPE_PATTERN);
  });

  it('accepts a carrier statement', () => {
    const request = {
      carrier: 'yalidine',
      reference: 'PAY-2026-44',
      paidAt: '2026-11-02',
      totalAmount: 2600,
      lines: [line],
    };

    expect(ImportPayoutRequestSchema.parse(request)).toEqual(request);
  });

  it('refuses negative amounts and empty statements', () => {
    const base = { carrier: 'yalidine', reference: 'P', paidAt: '2026-11-02', totalAmount: 0 };

    expect(ImportPayoutRequestSchema.safeParse({ ...base, lines: [] }).success).toBe(false);
    expect(
      ImportPayoutRequestSchema.safeParse({ ...base, lines: [{ ...line, codAmount: -1 }] }).success,
    ).toBe(false);
  });

  it('reports whether a statement is still being matched', () => {
    expect(PayoutStatusSchema.options).toEqual(['processing', 'reconciled']);
  });

  it('flags unpaid parcels after two weeks by default', () => {
    expect(MoneySettingsSchema.parse({})).toEqual({ missingAfterDays: 14 });
  });
});
