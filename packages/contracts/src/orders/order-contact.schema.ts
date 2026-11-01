import { z } from 'zod';
import { OrderSourceSchema } from './order.schema.js';

/**
 * `GET /internal/stores/:storeId/orders/:orderId/contact` (orders, service-to-service only):
 * who to message about an order (ADR-0004). Phones stay in orders and never travel in events.
 */
export const OrderContactSchema = z.strictObject({
  orderId: z.uuid(),
  ref: z.string(),
  name: z.string(),
  /** E.164. */
  phone: z.string(),
});
export type OrderContact = z.infer<typeof OrderContactSchema>;

/**
 * `GET /internal/stores/:storeId/orders/:orderId/origin` (orders, service-to-service only):
 * where an order came from, so integrations can push tracking back to the shop (ADR-0003).
 */
export const OrderOriginSchema = z.strictObject({
  orderId: z.uuid(),
  source: OrderSourceSchema,
  externalRef: z.string().nullable(),
});
export type OrderOrigin = z.infer<typeof OrderOriginSchema>;
