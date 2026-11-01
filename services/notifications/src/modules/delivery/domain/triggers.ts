import type { NotificationTrigger, OrderStatus, ParcelStatus } from '@trackecom/contracts';

/** The order moves that message the customer; every other move sends nothing. */
export function orderTrigger(to: OrderStatus): NotificationTrigger | null {
  return to === 'confirmed' ? 'order_confirmed' : null;
}

const PARCEL_TRIGGERS: Partial<Record<ParcelStatus, NotificationTrigger>> = {
  out_for_delivery: 'out_for_delivery',
  failed_attempt: 'failed_attempt',
  delivered: 'parcel_delivered',
  returned: 'parcel_returned',
};

export const parcelTrigger = (to: ParcelStatus): NotificationTrigger | null =>
  PARCEL_TRIGGERS[to] ?? null;

/** Attempts before a message is given up; the waits between them grow. */
export const MAX_ATTEMPTS = 4;
const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000];

/** How long to wait after the `attempts`-th failed try; null when it should not be retried. */
export function retryDelayMs(attempts: number): number | null {
  if (attempts >= MAX_ATTEMPTS) return null;
  return RETRY_DELAYS_MS[attempts - 1] ?? null;
}
