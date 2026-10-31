import type { MoneySummary } from '@trackecom/contracts';

/** The store's accounts. Debits are positive, credits negative; every movement sums to zero. */
export const ACCOUNTS = {
  /** What carriers owe the store. */
  receivable: 'carrier_receivable',
  /** COD earned on delivered parcels (credit side of the receivable). */
  sales: 'cod_sales',
  /** Money the carrier actually transferred. */
  cash: 'cash',
  /** Shipping and return fees the carrier kept. */
  fees: 'carrier_fees',
} as const;
export type Account = (typeof ACCOUNTS)[keyof typeof ACCOUNTS];

export interface Posting {
  readonly account: Account;
  readonly amount: number;
}

/** A parcel was delivered: the carrier now owes its COD. */
export const deliveryPostings = (cod: number): Posting[] => [
  { account: ACCOUNTS.receivable, amount: cod },
  { account: ACCOUNTS.sales, amount: -cod },
];

/** A payout line: the carrier settles the COD it collected, minus the fees it kept. */
export function payoutLinePostings(line: { collected: number; fees: number }): Posting[] {
  return [
    { account: ACCOUNTS.cash, amount: line.collected - line.fees },
    { account: ACCOUNTS.fees, amount: line.fees },
    { account: ACCOUNTS.receivable, amount: -line.collected },
  ];
}

export const isBalanced = (postings: readonly Posting[]): boolean =>
  postings.reduce((sum, posting) => sum + posting.amount, 0) === 0;

/**
 * Reads the summary off account balances. Because every movement balances,
 * `expected = received + fees + outstanding` holds by construction.
 */
export function summarize(
  balances: Readonly<Partial<Record<Account, number>>>,
  flaggedParcels: number,
): MoneySummary {
  return {
    expected: 0 - (balances[ACCOUNTS.sales] ?? 0),
    received: balances[ACCOUNTS.cash] ?? 0,
    fees: balances[ACCOUNTS.fees] ?? 0,
    outstanding: balances[ACCOUNTS.receivable] ?? 0,
    flaggedParcels,
  };
}
