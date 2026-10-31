import type { PayoutLineInput } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import type { ParcelRecord } from '../application/ports/money.repository.js';
import {
  duplicateTrackingNumbers,
  reconcile,
  statementTotals,
  transferGap,
} from './payout-statement.js';

const line = (trackingNumber: string, codAmount = 1000): PayoutLineInput => ({
  trackingNumber,
  codAmount,
  shippingFee: 400,
  returnFee: 0,
});
const known: ParcelRecord = {
  id: 'p1',
  storeId: 's1',
  carrier: 'yalidine',
  trackingNumber: 'a',
  orderId: null,
  expectedCod: 1000,
  status: 'awaiting_payout',
  deliveredAt: null,
  receivedCod: null,
  fees: 0,
  payoutId: null,
};
const context = {
  storeId: 's1',
  carrier: 'yalidine',
  payoutId: 'pay-1',
  paidAt: new Date('2026-11-10T00:00:00Z'),
  newId: () => 'n',
};

describe('payout statement', () => {
  it('adds up the lines and the gap with the transfer', () => {
    const totals = statementTotals([line('a'), line('b', 2000)]);

    expect(totals).toEqual({ codAmount: 3000, fees: 800, lineCount: 2 });
    expect(transferGap(2200, totals)).toBe(0);
    expect(transferGap(2000, totals)).toBe(-200);
  });

  it('finds tracking numbers listed twice', () => {
    expect(duplicateTrackingNumbers([line('a'), line('b'), line('a')])).toEqual(['a']);
  });

  it('counts matched and flagged lines and parks the transfer gap', () => {
    const result = reconcile(
      { totalAmount: 1000, lines: [line('a'), line('b')] },
      new Map([['a', known]]),
      context,
    );

    expect([result.matched, result.flagged]).toEqual([1, 1]);
    expect(result.gapPostings).toEqual([
      { account: 'cash', amount: -200 },
      { account: 'unallocated', amount: 200 },
    ]);
  });
});
