import type { PayoutLineInput, ReconciliationStatus } from '@trackecom/contracts';
import type { ParcelRecord } from '../application/ports/money.repository.js';
import { ACCOUNTS, type Posting, deliveryPostings, payoutLinePostings } from './ledger.js';

export interface LineContext {
  readonly storeId: string;
  readonly carrier: string;
  readonly payoutId: string;
  readonly paidAt: Date;
  readonly newId: () => string;
}

/** What one statement line does: the parcel's new state and one balanced ledger entry. */
export interface LineOutcome {
  readonly parcel: ParcelRecord;
  /** The status the parcel had when read; null for a parcel this line creates. */
  readonly previousStatus: ReconciliationStatus | null;
  readonly postings: readonly Posting[];
  readonly flagged: boolean;
}

const feesOf = (line: PayoutLineInput) => line.shippingFee + line.returnFee;

const newUnknownParcel = (line: PayoutLineInput, context: LineContext): ParcelRecord => ({
  id: context.newId(),
  storeId: context.storeId,
  carrier: context.carrier,
  trackingNumber: line.trackingNumber,
  orderId: null,
  expectedCod: null,
  status: 'unknown_line',
  deliveredAt: null,
  receivedCod: null,
  fees: 0,
  payoutId: null,
});

/**
 * A line for a tracking number we never saw shipped (or saw only on an earlier statement):
 * the money waits in `unallocated` and the line is flagged.
 */
function unknownLine(
  line: PayoutLineInput,
  context: LineContext,
  existing: ParcelRecord | undefined,
): LineOutcome {
  const parcel = existing ?? newUnknownParcel(line, context);
  const collected = { collected: line.codAmount, fees: feesOf(line) };
  return {
    parcel: {
      ...parcel,
      receivedCod: (parcel.receivedCod ?? 0) + line.codAmount,
      fees: parcel.fees + collected.fees,
      payoutId: context.payoutId,
    },
    previousStatus: existing ? existing.status : null,
    postings: payoutLinePostings({ ...collected, against: ACCOUNTS.unallocated }),
    flagged: true,
  };
}

/** A returned parcel that brought no cash only costs its fees; it needs no claim. */
const isPaidReturn = (parcel: ParcelRecord, line: PayoutLineInput) =>
  parcel.status === 'returned' && line.codAmount === 0;

function statusAfter(parcel: ParcelRecord, received: number): ReconciliationStatus {
  const open = ['awaiting_delivery', 'awaiting_payout', 'missing'].includes(parcel.status);
  return open && received === parcel.expectedCod ? 'matched' : 'amount_mismatch';
}

/** A line for a known parcel: settles its receivable, matched only when the COD is exact. */
function knownLine(parcel: ParcelRecord, line: PayoutLineInput, context: LineContext): LineOutcome {
  const fees = parcel.fees + feesOf(line);
  const settle = payoutLinePostings({ collected: line.codAmount, fees: feesOf(line) });
  const base = { ...parcel, fees, payoutId: context.payoutId };
  if (isPaidReturn(parcel, line)) {
    return { parcel: base, previousStatus: parcel.status, postings: settle, flagged: false };
  }
  // Paid before we heard of the delivery: the payout is the proof it was delivered.
  const lateDelivery = parcel.status === 'awaiting_delivery';
  const received = (parcel.receivedCod ?? 0) + line.codAmount;
  const status = statusAfter(parcel, received);
  return {
    parcel: {
      ...base,
      status,
      receivedCod: received,
      deliveredAt: lateDelivery ? context.paidAt : parcel.deliveredAt,
    },
    previousStatus: parcel.status,
    postings: [...(lateDelivery ? deliveryPostings(parcel.expectedCod ?? 0) : []), ...settle],
    flagged: status !== 'matched',
  };
}

/**
 * Matches one statement line to its parcel by tracking number (#42). Pure: the caller loads the
 * parcels and writes the outcomes in one transaction.
 */
export function matchLine(
  line: PayoutLineInput,
  parcel: ParcelRecord | undefined,
  context: LineContext,
): LineOutcome {
  if (!parcel || parcel.expectedCod === null) return unknownLine(line, context, parcel);
  return knownLine(parcel, line, context);
}
