import { describe, expect, it } from 'vitest';
import {
  ACCOUNTS,
  type Posting,
  deliveryPostings,
  isBalanced,
  payoutLinePostings,
  summarize,
} from './ledger.js';

const balancesOf = (postings: readonly Posting[]) =>
  postings.reduce<Record<string, number>>((sum, { account, amount }) => {
    sum[account] = (sum[account] ?? 0) + amount;
    return sum;
  }, {});

describe('ledger', () => {
  it('balances every movement', () => {
    expect(isBalanced(deliveryPostings(3100))).toBe(true);
    expect(isBalanced(payoutLinePostings({ collected: 3100, fees: 500 }))).toBe(true);
    expect(isBalanced(payoutLinePostings({ collected: 0, fees: 400 }))).toBe(true);
  });

  it('keeps expected = received + fees + outstanding', () => {
    const postings = [
      ...deliveryPostings(3100),
      ...deliveryPostings(2000),
      ...payoutLinePostings({ collected: 3100, fees: 500 }),
    ];

    const summary = summarize(balancesOf(postings), 0);

    expect(summary).toEqual({
      expected: 5100,
      received: 2600,
      fees: 500,
      outstanding: 2000,
      flaggedParcels: 0,
    });
    expect(summary.received + summary.fees + summary.outstanding).toBe(summary.expected);
  });

  it('reads an empty ledger as zero', () => {
    expect(summarize({}, 2)).toMatchObject({ expected: 0, outstanding: 0, flaggedParcels: 2 });
    expect(ACCOUNTS.cash).toBe('cash');
  });
});
