import { z } from 'zod';
import { WilayaCodeSchema } from '../geo/wilaya.schema.js';
import { DeliveryTypeSchema, DinarsSchema } from '../orders/order.schema.js';

/**
 * Two prices per wilaya and delivery type:
 * - the store's **selling price**, what the customer pays and what the order form shows;
 * - the carrier's **cost** (rate card), what the store pays, used for margins and carrier choice.
 */
export const StorePriceSchema = z.strictObject({
  wilayaCode: z.number().int(),
  deliveryType: DeliveryTypeSchema,
  /** null: the store does not deliver this way to this wilaya. */
  price: DinarsSchema.nullable(),
});
export type StorePrice = z.infer<typeof StorePriceSchema>;

/** `GET /pricing/store-prices`: every wilaya x delivery type, missing prices as null. */
export const StorePricesResponseSchema = z.strictObject({
  items: z.array(StorePriceSchema),
  freeShippingFrom: DinarsSchema.nullable(),
});
export type StorePricesResponse = z.infer<typeof StorePricesResponseSchema>;

/** `PUT /pricing/store-prices`: bulk edit from the settings screen; only listed rows change. */
export const UpdateStorePricesRequestSchema = z.strictObject({
  items: z
    .array(
      z.strictObject({
        wilayaCode: WilayaCodeSchema,
        deliveryType: DeliveryTypeSchema,
        price: DinarsSchema.nullable(),
      }),
    )
    .max(200)
    .default([]),
  /** Orders whose items total reaches this amount ship for free; null turns the rule off. */
  freeShippingFrom: DinarsSchema.nullable().optional(),
});
export type UpdateStorePricesRequest = z.input<typeof UpdateStorePricesRequestSchema>;

/** `GET /pricing/quote`: the fee the order form shows live. */
export const ShippingQuoteQuerySchema = z.strictObject({
  wilayaCode: WilayaCodeSchema,
  deliveryType: DeliveryTypeSchema,
  /** Items total, to apply free shipping. */
  subtotal: z.coerce.number().int().min(0).default(0),
});
export type ShippingQuoteQuery = z.infer<typeof ShippingQuoteQuerySchema>;

export const ShippingQuoteSchema = z.strictObject({
  available: z.boolean(),
  /** What the customer pays for shipping (0 when free), null when not available. */
  fee: DinarsSchema.nullable(),
  freeShippingApplied: z.boolean(),
});
export type ShippingQuote = z.infer<typeof ShippingQuoteSchema>;

export const RateCardRowSchema = z.strictObject({
  fromWilaya: WilayaCodeSchema,
  toWilaya: WilayaCodeSchema,
  deliveryType: DeliveryTypeSchema,
  price: DinarsSchema,
  returnFee: DinarsSchema,
  /** Above this weight the carrier adds a surcharge; null when the carrier sets none. */
  weightLimitGrams: z.number().int().positive().nullable(),
});
export type RateCardRow = z.infer<typeof RateCardRowSchema>;

/** `PUT /pricing/rate-cards/:carrier`: replaces a carrier's costs for the store (API or Excel import). */
export const ReplaceRateCardRequestSchema = z.strictObject({
  rows: z
    .array(RateCardRowSchema)
    .min(1)
    .max(69 * 69 * 2),
});
export type ReplaceRateCardRequest = z.infer<typeof ReplaceRateCardRequestSchema>;

export const CarrierCodeSchema = z.string().regex(/^[a-z0-9-]{2,40}$/);
