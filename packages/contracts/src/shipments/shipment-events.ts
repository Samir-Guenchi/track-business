import { z } from 'zod';
import { WilayaCodeSchema } from '../geo/wilaya.schema.js';
import { DeliveryTypeSchema } from '../orders/order.schema.js';
import { CarrierCodeSchema } from '../pricing/pricing.schema.js';

/** The shipment-creation conversation between orders and shipping (#31, #32). */
export const SHIPMENT_EVENTS = {
  shipRequested: 'orders.order.ship-requested.v1',
  created: 'shipping.shipment.created.v1',
  failed: 'shipping.shipment.failed.v1',
} as const;

/**
 * Orders asks shipping for a parcel. Carries what the label needs, because shipping never reads
 * the orders database. Contains personal data: consumers keep it only on the shipment.
 */
export const ShipRequestedEventSchema = z.strictObject({
  orderId: z.uuid(),
  /** `<order ref>-v<order version>`: one per request, sent to the carrier to make retries safe. */
  reference: z.string().min(1).max(60),
  carrier: CarrierCodeSchema,
  originWilayaCode: WilayaCodeSchema,
  recipient: z.strictObject({
    name: z.string().min(1),
    phone: z.string().min(1),
    phone2: z.string().nullable(),
    address: z.string().nullable(),
  }),
  wilayaCode: WilayaCodeSchema,
  communeId: z.number().int().positive(),
  deliveryType: DeliveryTypeSchema,
  stopDeskId: z.string().nullable(),
  codAmount: z.number().int().nonnegative(),
  declaredValue: z.number().int().nonnegative(),
  /** Short label text, e.g. "2 x Robe". */
  contents: z.string().min(1).max(200),
  notes: z.string().nullable(),
});
export type ShipRequestedEvent = z.infer<typeof ShipRequestedEventSchema>;

export const ShipmentCreatedEventSchema = z.strictObject({
  shipmentId: z.uuid(),
  orderId: z.uuid(),
  reference: z.string(),
  carrier: CarrierCodeSchema,
  trackingNumber: z.string(),
  publicCode: z.string(),
  labelUrl: z.string().nullable(),
  /** What the carrier must collect and pay back: payments (#42) expects it from this event. */
  codAmount: z.number().int().nonnegative(),
});
export type ShipmentCreatedEvent = z.infer<typeof ShipmentCreatedEventSchema>;

/** Why no parcel was created. Only `carrier_unavailable` is worth retrying as is. */
export const ShipmentFailureSchema = z.enum([
  'not_connected',
  'not_supported',
  'invalid_request',
  'carrier_rejected',
  'carrier_unavailable',
]);
export type ShipmentFailure = z.infer<typeof ShipmentFailureSchema>;

export const ShipmentFailedEventSchema = z.strictObject({
  orderId: z.uuid(),
  reference: z.string(),
  carrier: CarrierCodeSchema,
  reason: ShipmentFailureSchema,
  /** The carrier's message for the seller, without personal data. */
  message: z.string().max(500),
});
export type ShipmentFailedEvent = z.infer<typeof ShipmentFailedEventSchema>;
