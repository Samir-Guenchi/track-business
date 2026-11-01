import { z } from 'zod';

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
