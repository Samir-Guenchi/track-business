import { z } from 'zod';
import {
  CreateDeliveryRequestSchema,
  DeliveryRequestStateSchema,
} from './delivery-request.schema.js';
/** One customer request as the seller sees it: the change list sent to carriers each day. */
export const DeliveryRequestSchema = z.strictObject({
  id: z.uuid(),
  shipmentId: z.uuid(),
  orderId: z.uuid(),
  carrier: z.string(),
  trackingNumber: z.string(),
  request: CreateDeliveryRequestSchema,
  state: DeliveryRequestStateSchema,
  createdAt: z.iso.datetime(),
  handledAt: z.iso.datetime().nullable(),
});
export const ListDeliveryRequestsQuerySchema = z.strictObject({
  state: DeliveryRequestStateSchema.optional(),
  orderId: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export const ListDeliveryRequestsResponseSchema = z.strictObject({
  items: z.array(DeliveryRequestSchema),
});
/** The seller marks a request as passed to the carrier, or declines it. */
export const UpdateDeliveryRequestSchema = z.strictObject({
  state: z.enum(['sent', 'dismissed']),
});
export const DELIVERY_REQUEST_EVENTS = {
  created: 'shipping.delivery-request.created.v1',
};
/** Notifications tell the seller; orders can show it on the order timeline. */
export const DeliveryRequestCreatedEventSchema = z.strictObject({
  requestId: z.uuid(),
  shipmentId: z.uuid(),
  orderId: z.uuid(),
  request: CreateDeliveryRequestSchema,
});
