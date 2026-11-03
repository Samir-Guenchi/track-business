import { z } from 'zod';
import { ParcelStatusSchema, type ParcelStatus } from './parcel-status.js';

/**
 * Delivery days (Fridays and holidays not counted) a parcel may sit without any tracking event
 * before it counts as stuck (#197). Final statuses never get stuck.
 */
export const STUCK_AFTER_DELIVERY_DAYS: Readonly<Partial<Record<ParcelStatus, number>>> = {
  created: 3,
  picked_up: 2,
  in_transit: 3,
  out_for_delivery: 1,
  failed_attempt: 2,
  returning: 5,
};

export const StuckParcelsQuerySchema = z.strictObject({
  carrier: z.string().max(40).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});
export type StuckParcelsQuery = z.infer<typeof StuckParcelsQuerySchema>;

export const StuckParcelSchema = z.strictObject({
  shipmentId: z.uuid(),
  orderId: z.uuid(),
  carrier: z.string(),
  trackingNumber: z.string(),
  toWilayaCode: z.number().int().nullable(),
  status: ParcelStatusSchema,
  /** Last tracking event, or the parcel's creation when the carrier never answered. */
  lastMoveAt: z.iso.datetime(),
  idleDays: z.number().int().min(0),
});
export type StuckParcel = z.infer<typeof StuckParcelSchema>;

/** `GET /stuck-parcels`: oldest first, and the carrier x wilaya pairs where many are stuck. */
export const StuckParcelsResponseSchema = z.strictObject({
  items: z.array(StuckParcelSchema),
  hotspots: z.array(
    z.strictObject({
      carrier: z.string(),
      toWilayaCode: z.number().int().nullable(),
      count: z.number().int().min(1),
    }),
  ),
});
export type StuckParcelsResponse = z.infer<typeof StuckParcelsResponseSchema>;
