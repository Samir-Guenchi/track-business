import { z } from 'zod';
import { WilayaCodeSchema } from '../geo/wilaya.schema.js';
import { CarrierCodeSchema } from '../pricing/pricing.schema.js';

/** Most a seller ships in one click; larger selections are split by the app. */
export const SHIP_ORDERS_MAX = 100;

/**
 * `POST /orders/ship` (#31): hands confirmed orders to a carrier. The parcels are created in the
 * background; each order moves to `shipped` (or back to `confirmed` with a reason) when done.
 */
export const ShipOrdersRequestSchema = z.strictObject({
  orderIds: z.array(z.uuid()).min(1).max(SHIP_ORDERS_MAX),
  carrier: CarrierCodeSchema,
  /** Where the parcels leave from (the store's warehouse wilaya). */
  originWilayaCode: WilayaCodeSchema,
});
export type ShipOrdersRequest = z.infer<typeof ShipOrdersRequestSchema>;

export const ShipOrderResultSchema = z.discriminatedUnion('status', [
  z.strictObject({ orderId: z.uuid(), status: z.literal('requested') }),
  z.strictObject({
    orderId: z.uuid(),
    status: z.literal('skipped'),
    /** `orders.not_found`, `orders.illegal_transition`, `orders.conflict`... */
    code: z.string(),
  }),
]);
export type ShipOrderResult = z.infer<typeof ShipOrderResultSchema>;

/** One result per requested order, in request order. */
export const ShipOrdersResponseSchema = z.strictObject({ items: z.array(ShipOrderResultSchema) });
export type ShipOrdersResponse = z.infer<typeof ShipOrdersResponseSchema>;
