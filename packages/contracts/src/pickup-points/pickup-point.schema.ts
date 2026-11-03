import { z } from 'zod';
import { AlgerianPhoneSchema } from '../common/phone.schema.js';
import { DinarsSchema } from '../orders/order.schema.js';

/**
 * Partner pickup points (#202): a local shop (superette, taxiphone, librairie) holds parcels for
 * customers far from a carrier desk, releases each one only against the customer's code, and
 * collects the cash on delivery that it then hands over to the seller.
 */
export const PickupPointInputSchema = z.strictObject({
  name: z.string().trim().min(2).max(80),
  wilayaCode: z.number().int().min(1).max(99),
  communeId: z.number().int().positive(),
  address: z.string().trim().min(3).max(255),
  phone: AlgerianPhoneSchema,
  /** e.g. "Sat-Thu 08:00-20:00". */
  hours: z.string().trim().max(120).default(''),
  lat: z.number().min(18.9).max(37.2).optional(),
  lng: z.number().min(-8.7).max(12).optional(),
  /** Parcels it can hold at once. */
  capacity: z.number().int().min(1).max(500),
  feePerParcel: DinarsSchema,
  active: z.boolean().default(true),
});
export type PickupPointInput = z.input<typeof PickupPointInputSchema>;

export const PickupPointSchema = z.strictObject({
  id: z.uuid(),
  name: z.string(),
  wilayaCode: z.number().int(),
  communeId: z.number().int(),
  address: z.string(),
  phone: z.string(),
  hours: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  capacity: z.number().int(),
  feePerParcel: z.number().int(),
  active: z.boolean(),
  /** Parcels waiting at the point now. */
  holding: z.number().int().min(0),
  /** Cash collected and not handed over yet. */
  cashToCollect: z.number().int().min(0),
});
export type PickupPoint = z.infer<typeof PickupPointSchema>;

export const ListPickupPointsResponseSchema = z.strictObject({
  items: z.array(PickupPointSchema),
});
export type ListPickupPointsResponse = z.infer<typeof ListPickupPointsResponseSchema>;

export const PickupParcelStateSchema = z.enum(['held', 'released']);
export type PickupParcelState = z.infer<typeof PickupParcelStateSchema>;

/** `POST /pickup-points/:id/parcels`: the courier dropped the parcel at the point (scan in). */
export const DropParcelSchema = z.strictObject({ shipmentId: z.uuid() });
export type DropParcel = z.infer<typeof DropParcelSchema>;

/** `POST /pickup-points/:id/parcels/:shipmentId/release`: the customer gave their code. */
export const ReleaseParcelSchema = z.strictObject({
  code: z.string().regex(/^\d{6}$/),
  /** Cash the shop took from the customer, usually the amount to collect. */
  cashCollected: DinarsSchema,
});
export type ReleaseParcel = z.infer<typeof ReleaseParcelSchema>;

export const PickupParcelSchema = z.strictObject({
  shipmentId: z.uuid(),
  orderId: z.uuid(),
  trackingNumber: z.string(),
  state: PickupParcelStateSchema,
  droppedAt: z.iso.datetime(),
  releasedAt: z.iso.datetime().nullable(),
  cashCollected: z.number().int().nullable(),
  handedOverAt: z.iso.datetime().nullable(),
});
export type PickupParcel = z.infer<typeof PickupParcelSchema>;

export const ListPickupParcelsResponseSchema = z.strictObject({
  items: z.array(PickupParcelSchema),
});
export type ListPickupParcelsResponse = z.infer<typeof ListPickupParcelsResponseSchema>;

/** `POST /pickup-points/:id/handover`: the cash the shop handed to the seller now. */
export const HandoverResponseSchema = z.strictObject({
  parcels: z.number().int().min(0),
  amount: z.number().int().min(0),
});
export type HandoverResponse = z.infer<typeof HandoverResponseSchema>;

/** `GET /pickup-points/:id/statement?month=2026-11`: what the shop earned and collected. */
export const PickupStatementQuerySchema = z.strictObject({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
});
export const PickupStatementSchema = z.strictObject({
  month: z.string(),
  released: z.number().int().min(0),
  fees: z.number().int().min(0),
  cashCollected: z.number().int().min(0),
  cashHandedOver: z.number().int().min(0),
});
export type PickupStatement = z.infer<typeof PickupStatementSchema>;

/** `GET /public/tracking/:code/pickup`: where to collect the parcel and the code to give. */
export const PublicPickupSchema = z.strictObject({
  pickup: z
    .strictObject({
      name: z.string(),
      address: z.string(),
      hours: z.string(),
      phone: z.string(),
      lat: z.number().nullable(),
      lng: z.number().nullable(),
      state: PickupParcelStateSchema,
      /** Shown only to the tracking-link holder, and only while the parcel waits. */
      code: z.string().nullable(),
    })
    .nullable(),
});
export type PublicPickup = z.infer<typeof PublicPickupSchema>;
