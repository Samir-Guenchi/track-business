import type { ParcelStatus } from '@trackecom/contracts';

const MINUTE = 60_000;

/**
 * Polling fallback cadence (#32): often when the parcel is about to move, rarely while it crosses
 * the country, never once it is final. Carriers with webhooks are polled too, as a safety net.
 */
const POLL_EVERY_MINUTES: Readonly<Record<ParcelStatus, number | null>> = {
  created: 60,
  picked_up: 60,
  in_transit: 120,
  out_for_delivery: 10,
  failed_attempt: 30,
  returning: 240,
  delivered: null,
  returned: null,
  cancelled: null,
};

export const isFinalStatus = (status: ParcelStatus): boolean => POLL_EVERY_MINUTES[status] === null;

/** When to ask the carrier next; null stops polling. */
export function nextPollAt(status: ParcelStatus, now: Date): Date | null {
  const minutes = POLL_EVERY_MINUTES[status];
  return minutes === null ? null : new Date(now.getTime() + minutes * MINUTE);
}
