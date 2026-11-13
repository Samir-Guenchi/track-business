import { z } from 'zod';
import {
  ReturnRequestKindSchema,
  ReturnRequestReasonSchema,
  ReturnRequestStateSchema,
} from './return-request.schema.js';

export const ListReturnRequestsQuerySchema = z.strictObject({
  state: ReturnRequestStateSchema.optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});
export type ListReturnRequestsQuery = z.infer<typeof ListReturnRequestsQuerySchema>;

export const SellerReturnRequestSchema = z.strictObject({
  id: z.uuid(),
  shipmentId: z.uuid(),
  orderId: z.uuid(),
  carrier: z.string(),
  trackingNumber: z.string(),
  kind: ReturnRequestKindSchema,
  reason: ReturnRequestReasonSchema,
  wanted: z.string().nullable(),
  note: z.string().nullable(),
  state: ReturnRequestStateSchema,
  sellerMessage: z.string().nullable(),
  newOrderId: z.uuid().nullable(),
  createdAt: z.iso.datetime(),
  decidedAt: z.iso.datetime().nullable(),
});
export type SellerReturnRequest = z.infer<typeof SellerReturnRequestSchema>;

/** `GET /return-requests`: newest first. */
export const ListReturnRequestsResponseSchema = z.strictObject({
  items: z.array(SellerReturnRequestSchema),
});
export type ListReturnRequestsResponse = z.infer<typeof ListReturnRequestsResponseSchema>;

/**
 * `PATCH /return-requests/:id`: decide a pending request once. An accepted exchange carries the
 * exchange order the seller just created (#138), so the customer can follow the new parcel.
 */
export const DecideReturnRequestSchema = z.discriminatedUnion('decision', [
  z.strictObject({
    decision: z.literal('accept_exchange'),
    newOrderId: z.uuid(),
    message: z.string().trim().max(300).optional(),
  }),
  z.strictObject({
    decision: z.literal('accept_return'),
    message: z.string().trim().max(300).optional(),
  }),
  z.strictObject({ decision: z.literal('refuse'), message: z.string().trim().min(1).max(300) }),
]);
export type DecideReturnRequest = z.infer<typeof DecideReturnRequestSchema>;

export const RETURN_REQUEST_EVENTS = {
  created: 'shipping.return-request.created.v1',
  decided: 'shipping.return-request.decided.v1',
} as const;

export const ReturnRequestEventSchema = z.strictObject({
  requestId: z.uuid(),
  shipmentId: z.uuid(),
  orderId: z.uuid(),
  kind: ReturnRequestKindSchema,
  state: ReturnRequestStateSchema,
  newOrderId: z.uuid().nullable(),
});
export type ReturnRequestEvent = z.infer<typeof ReturnRequestEventSchema>;
