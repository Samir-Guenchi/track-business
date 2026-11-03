import { z } from 'zod';
import { OrderStatusSchema } from './order-status.js';
/** Published by the orders service through its outbox; consumers must be idempotent. */
export const ORDER_EVENTS = {
  created: 'orders.order.created.v1',
  statusChanged: 'orders.order.status-changed.v1',
  deleted: 'orders.order.deleted.v1',
};
export const OrderCreatedEventSchema = z.strictObject({
  orderId: z.string(),
  ref: z.string(),
  status: OrderStatusSchema,
  wilayaCode: z.number().int(),
  codAmount: z.number().int(),
});
export const OrderStatusChangedEventSchema = z.strictObject({
  orderId: z.string(),
  from: OrderStatusSchema,
  to: OrderStatusSchema,
  actorId: z.string().nullable(),
  reason: z.string().nullable(),
});
export const OrderDeletedEventSchema = z.strictObject({ orderId: z.string() });
