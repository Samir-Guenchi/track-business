import { z } from 'zod';
import { cursorPage, CursorQuerySchema } from '../common/pagination.schema.js';
import { OrderSchema, OrderSourceSchema, TagSchema } from './order.schema.js';
import { ORDER_STATUSES, OrderStatusSchema } from './order-status.js';

const ORDER_STATUS_COUNT = ORDER_STATUSES.length;

/** `POST /orders/:id/status`. */
export const ChangeStatusRequestSchema = z
  .strictObject({
    status: OrderStatusSchema,
    reason: z.string().trim().max(300).optional(),
    /** Required when moving to `postponed`: when to call the customer again. */
    postponedUntil: z.iso.datetime().optional(),
  })
  .refine((body) => body.status !== 'postponed' || body.postponedUntil !== undefined, {
    message: 'postponedUntil is required when postponing',
    path: ['postponedUntil'],
  });
export type ChangeStatusRequest = z.infer<typeof ChangeStatusRequestSchema>;

/** `?status=to_confirm,postponed`. */
const StatusListSchema = z
  .string()
  .transform((value) => value.split(',').filter(Boolean))
  .pipe(z.array(OrderStatusSchema).min(1).max(ORDER_STATUS_COUNT));

/** `GET /orders` query string. Every filter is optional and they combine with AND. */
export const ListOrdersQuerySchema = CursorQuerySchema.extend({
  status: StatusListSchema.optional(),
  wilayaCode: z.coerce.number().int().min(1).max(99).optional(),
  source: OrderSourceSchema.optional(),
  agentId: z.string().min(1).optional(),
  carrier: z.string().min(1).max(40).optional(),
  tag: TagSchema.optional(),
  createdFrom: z.iso.datetime().optional(),
  createdTo: z.iso.datetime().optional(),
  /** Searches ref, customer name, phone (any spelling) and tracking number. */
  q: z.string().trim().min(2).max(100).optional(),
});
export type ListOrdersQuery = z.infer<typeof ListOrdersQuerySchema>;

export const ListOrdersResponseSchema = cursorPage(OrderSchema);
export type ListOrdersResponse = z.infer<typeof ListOrdersResponseSchema>;

const OrderIdsSchema = z.array(z.string().min(1)).min(1).max(500);

/** `POST /orders/bulk`: one action applied to many orders; each order succeeds or fails alone. */
export const BulkOrdersRequestSchema = z.discriminatedUnion('action', [
  z.strictObject({
    action: z.literal('change_status'),
    orderIds: OrderIdsSchema,
    status: OrderStatusSchema,
  }),
  z.strictObject({
    action: z.literal('assign_agent'),
    orderIds: OrderIdsSchema,
    agentId: z.string().min(1).nullable(),
  }),
  z.strictObject({ action: z.literal('add_tag'), orderIds: OrderIdsSchema, tag: TagSchema }),
  z.strictObject({ action: z.literal('remove_tag'), orderIds: OrderIdsSchema, tag: TagSchema }),
  z.strictObject({ action: z.literal('delete'), orderIds: OrderIdsSchema }),
]);
export type BulkOrdersRequest = z.infer<typeof BulkOrdersRequestSchema>;

export const BulkOrdersResponseSchema = z.strictObject({
  succeeded: z.array(z.string()),
  failed: z.array(z.strictObject({ orderId: z.string(), code: z.string() })),
});
export type BulkOrdersResponse = z.infer<typeof BulkOrdersResponseSchema>;

/** `GET /orders/:id/history`: newest first. */
export const OrderHistoryEntrySchema = z.strictObject({
  id: z.string().min(1),
  at: z.iso.datetime(),
  actorId: z.string().nullable(),
  kind: z.enum([
    'created',
    'edited',
    'status_changed',
    'assigned',
    'tagged',
    'deleted',
    'call_logged',
  ]),
  fromStatus: OrderStatusSchema.nullable(),
  toStatus: OrderStatusSchema.nullable(),
  note: z.string().nullable(),
});
export type OrderHistoryEntry = z.infer<typeof OrderHistoryEntrySchema>;

export const OrderHistoryResponseSchema = z.strictObject({
  items: z.array(OrderHistoryEntrySchema),
});
export type OrderHistoryResponse = z.infer<typeof OrderHistoryResponseSchema>;
