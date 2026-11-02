import { z } from 'zod';
import { FailedAttemptReasonSchema, ParcelStatusSchema } from './parcel-status.js';

/** Published by the shipping service through its outbox; consumers must be idempotent. */
export const TRACKING_EVENTS = {
  statusChanged: 'shipping.shipment.status-changed.v1',
  unknownCarrierStatus: 'shipping.carrier-status.unknown.v1',
} as const;

/**
 * The orders service moves the order (ORDER_STATUS_FOR_PARCEL); notifications (#37, #46) tell the
 * seller and the customer. Emitted once per real change, never for a replayed carrier event.
 */
export const ShipmentStatusChangedEventSchema = z.strictObject({
  shipmentId: z.string(),
  orderId: z.string(),
  carrier: z.string(),
  trackingNumber: z.string(),
  from: ParcelStatusSchema,
  to: ParcelStatusSchema,
  failureReason: FailedAttemptReasonSchema.nullable(),
  at: z.iso.datetime(),
});
export type ShipmentStatusChangedEvent = z.infer<typeof ShipmentStatusChangedEventSchema>;

/** A carrier label nobody mapped yet: kept on the timeline as raw text and alerted, not dropped. */
export const UnknownCarrierStatusEventSchema = z.strictObject({
  carrier: z.string(),
  carrierStatus: z.string(),
  shipmentId: z.string(),
});
export type UnknownCarrierStatusEvent = z.infer<typeof UnknownCarrierStatusEventSchema>;
