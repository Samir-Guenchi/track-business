import { z } from 'zod';
import { FailedAttemptReasonSchema, ParcelStatusSchema } from './parcel-status.js';

/** One scan or status update from a carrier, after normalisation. */
export const TrackingEventSchema = z.strictObject({
  id: z.uuid(),
  /** null for a carrier label we do not map yet: shown with its raw text, never dropped. */
  status: ParcelStatusSchema.nullable(),
  /** The carrier's own label, shown in the timeline next to ours. */
  carrierStatus: z.string(),
  location: z.string().nullable(),
  note: z.string().nullable(),
  failureReason: FailedAttemptReasonSchema.nullable(),
  at: z.iso.datetime(),
});
export type TrackingEvent = z.infer<typeof TrackingEventSchema>;

export const ShipmentSummarySchema = z.strictObject({
  id: z.uuid(),
  orderId: z.uuid(),
  carrier: z.string(),
  trackingNumber: z.string(),
  status: ParcelStatusSchema,
  lastEventAt: z.iso.datetime().nullable(),
  /** Code used by the public tracking page link (#34); not guessable from the tracking number. */
  publicCode: z.string(),
});
export type ShipmentSummary = z.infer<typeof ShipmentSummarySchema>;

/**
 * `GET /tracking/orders/:orderId`: every shipment of an order (a re-shipped order has several),
 * newest first, each with its events newest first. Used by the order detail timeline (#35).
 */
export const OrderTrackingResponseSchema = z.strictObject({
  items: z.array(
    z.strictObject({ shipment: ShipmentSummarySchema, events: z.array(TrackingEventSchema) }),
  ),
});
export type OrderTrackingResponse = z.infer<typeof OrderTrackingResponseSchema>;

/**
 * `GET /public/tracking/:publicCode`: what the customer sees on the branded page (#34). No phone,
 * address, name or carrier note: only statuses, places and times.
 */
export const PublicTrackingResponseSchema = z.strictObject({
  status: ParcelStatusSchema,
  carrier: z.string(),
  trackingNumber: z.string(),
  events: z.array(
    z.strictObject({
      status: ParcelStatusSchema,
      location: z.string().nullable(),
      at: z.iso.datetime(),
    }),
  ),
});
export type PublicTrackingResponse = z.infer<typeof PublicTrackingResponseSchema>;

export const PublicCodeSchema = z.string().regex(/^[A-Za-z0-9_-]{16,32}$/);
