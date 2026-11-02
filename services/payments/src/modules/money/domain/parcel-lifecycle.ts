import type { ParcelStatus } from '@trackecom/contracts';
import type { ParcelRecord } from '../application/ports/money.repository.js';
import { type Posting, deliveryPostings } from './ledger.js';

export interface ParcelMove {
  readonly parcel: ParcelRecord;
  readonly postings: readonly Posting[];
}

/**
 * What a carrier status means for the money (#42): a delivered parcel now owes its COD, a
 * returned one owes nothing. Only a parcel still out with the carrier moves; anything else
 * (a replay, a payout that arrived first) changes nothing.
 */
export function applyParcelStatus(
  parcel: ParcelRecord,
  to: ParcelStatus,
  at: Date,
): ParcelMove | null {
  if (parcel.status !== 'awaiting_delivery') return null;
  if (to === 'delivered') {
    return {
      parcel: { ...parcel, status: 'awaiting_payout', deliveredAt: at },
      postings: deliveryPostings(parcel.expectedCod ?? 0),
    };
  }
  if (to === 'returned') return { parcel: { ...parcel, status: 'returned' }, postings: [] };
  return null;
}
