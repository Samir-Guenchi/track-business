import { z } from 'zod';
import type { OrderStatus } from '../orders/order-status.js';

/** Normalised parcel status shared by every carrier (carrier labels map onto these). */
export const PARCEL_STATUSES = [
  'created',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'failed_attempt',
  'returning',
  'returned',
  'cancelled',
] as const;
export const ParcelStatusSchema = z.enum(PARCEL_STATUSES);
export type ParcelStatus = z.infer<typeof ParcelStatusSchema>;

/** Why a delivery attempt failed, as far as the carrier tells us. */
export const FailedAttemptReasonSchema = z.enum([
  'absent',
  'refused',
  'wrong_address',
  'phone_off',
  'no_answer',
  'postponed_by_customer',
  'other',
]);
export type FailedAttemptReason = z.infer<typeof FailedAttemptReasonSchema>;

/**
 * The order status a parcel status moves the order to. `created` and `cancelled` leave the order
 * alone (the shipment flow sets `shipped`; a cancelled parcel goes back to the seller's hands).
 */
export const ORDER_STATUS_FOR_PARCEL: Readonly<Record<ParcelStatus, OrderStatus | null>> = {
  created: null,
  picked_up: 'in_transit',
  in_transit: 'in_transit',
  out_for_delivery: 'out_for_delivery',
  delivered: 'delivered',
  failed_attempt: 'failed_attempt',
  returning: 'returning',
  returned: 'returned',
  cancelled: null,
};
