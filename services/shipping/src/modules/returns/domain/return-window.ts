import type { ParcelStatus } from '@trackecom/contracts';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Carrier statuses that mean "on its way back to the seller". */
export const RETURN_STATUSES: readonly ParcelStatus[] = ['returning', 'returned'];

export const isAnnouncedReturn = (status: string): boolean =>
  (RETURN_STATUSES as readonly string[]).includes(status);

/** Whole days since the carrier first said the parcel goes back. */
export const daysWaiting = (since: Date, now: Date): number =>
  Math.max(0, Math.floor((now.getTime() - since.getTime()) / DAY_MS));

/** A return announced before this moment and still not received is overdue (likely lost). */
export const overdueCutoff = (now: Date, overdueDays: number): Date =>
  new Date(now.getTime() - overdueDays * DAY_MS);
