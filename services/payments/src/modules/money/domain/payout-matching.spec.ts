import type { PayoutLineInput } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import type { ParcelRecord } from '../application/ports/money.repository.js';
import { isBalanced } from './ledger.js';
import { matchLine } from './payout-matching.js';

const context = {
  storeId: 's1',
  carrier: 'yalidine',
  payoutId: 'pay-1',
  paidAt: new Date('2026-11-10T00:00:00Z'),
  newId: () => 'new-id',
};
const parcel = (overrides: Partial<ParcelRecord> = {}): ParcelRecord => ({
  id: 'p1',
  storeId: 's1',
  carrier: 'yalidine',
  trackingNumber: 'yal-1',
  orderId: null,
  expectedCod: 3100,
  status: 'awaiting_payout',
  deliveredAt: new Date('2026-11-03T00:00:00Z'),
  receivedCod: null,
  fees: 0,
  payoutId: null,
  ...overrides,
});
const line = (overrides: Partial<PayoutLineInput> = {}): PayoutLineInput => ({
  trackingNumber: 'yal-1',
  codAmount: 3100,
  shippingFee: 500,
  returnFee: 0,
  ...overrides,
});

describe('matchLine', () => {
  it('matches a delivered parcel paid in full and settles its receivable', () => {
    const outcome = matchLine(line(), parcel(), context);

    expect(outcome.parcel).toMatchObject({ status: 'matched', receivedCod: 3100, fees: 500 });
    expect(outcome.flagged).toBe(false);
    expect(outcome.postings).toEqual([
      { account: 'cash', amount: 2600 },
      { account: 'carrier_fees', amount: 500 },
      { account: 'carrier_receivable', amount: -3100 },
    ]);
  });

  it('flags a short payment and leaves the rest owed', () => {
    const outcome = matchLine(line({ codAmount: 3000 }), parcel(), context);

    expect(outcome.parcel.status).toBe('amount_mismatch');
    expect(outcome.flagged).toBe(true);
  });

  it('clears a parcel flagged missing once it is paid', () => {
    expect(matchLine(line(), parcel({ status: 'missing' }), context).parcel.status).toBe('matched');
  });

  it('books the delivery first when the payout arrives before the tracking update', () => {
    const outcome = matchLine(line(), parcel({ status: 'awaiting_delivery' }), context);

    expect(outcome.parcel).toMatchObject({ status: 'matched', deliveredAt: context.paidAt });
    expect(outcome.postings).toHaveLength(5);
    expect(isBalanced(outcome.postings)).toBe(true);
  });

  it('keeps a returned parcel returned when only its fees are charged', () => {
    const outcome = matchLine(
      line({ codAmount: 0, shippingFee: 0, returnFee: 200 }),
      parcel({ status: 'returned', deliveredAt: null }),
      context,
    );

    expect(outcome.parcel).toMatchObject({ status: 'returned', fees: 200, receivedCod: null });
    expect(outcome.flagged).toBe(false);
  });

  it('flags a parcel paid a second time', () => {
    const paid = parcel({ status: 'matched', receivedCod: 3100, payoutId: 'pay-0' });

    expect(matchLine(line(), paid, context).parcel).toMatchObject({
      status: 'amount_mismatch',
      receivedCod: 6200,
      payoutId: 'pay-1',
    });
  });

  it('parks a line for an unknown parcel in unallocated', () => {
    const outcome = matchLine(line({ trackingNumber: 'yal-404' }), undefined, context);

    expect(outcome.previousStatus).toBeNull();
    expect(outcome.parcel).toMatchObject({ id: 'new-id', status: 'unknown_line', orderId: null });
    expect(outcome.postings.at(-1)).toEqual({ account: 'unallocated', amount: -3100 });
  });

  it('adds to an unknown parcel seen on an earlier statement', () => {
    const earlier = parcel({ expectedCod: null, status: 'unknown_line', receivedCod: 100 });
    const outcome = matchLine(line(), earlier, context);

    expect(outcome.previousStatus).toBe('unknown_line');
    expect(outcome.parcel).toMatchObject({ id: 'p1', receivedCod: 3200 });
  });

  it('always writes a balanced entry', () => {
    const lines = [line(), line({ codAmount: 10 }), line({ returnFee: 99 })];

    for (const each of lines) {
      expect(isBalanced(matchLine(each, parcel(), context).postings)).toBe(true);
      expect(isBalanced(matchLine(each, undefined, context).postings)).toBe(true);
    }
  });
});
