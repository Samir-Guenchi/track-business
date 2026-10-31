import {
  BulkOrdersRequestSchema,
  BulkOrdersResponseSchema,
  ShipOrdersRequestSchema,
  ShipOrdersResponseSchema,
  ChangeStatusRequestSchema,
  CreateOrderRequestSchema,
  ListOrdersQuerySchema,
  ListOrdersResponseSchema,
  OrderHistoryResponseSchema,
  OrderSchema,
  UpdateOrderRequestSchema,
} from '@trackecom/contracts';
import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

const ok = (description: string, schema: z.ZodType, status = '200') => ({
  [status]: { description, content: { 'application/json': { schema } } },
});
const body = (schema: z.ZodType) => ({ content: { 'application/json': { schema } } });
const byId = { path: z.object({ id: z.uuid() }) };

/** Every route needs `Authorization: Bearer <token>` (or the te_access cookie) and `x-store-id`. */
export const ordersOpenApiPaths: ZodOpenApiPathsObject = {
  '/orders': {
    get: {
      summary: 'List orders with filters and search (newest first)',
      requestParams: { query: ListOrdersQuerySchema },
      responses: ok('One page', ListOrdersResponseSchema),
    },
    post: {
      summary: 'Create an order',
      requestBody: body(CreateOrderRequestSchema),
      responses: ok('Created', OrderSchema, '201'),
    },
  },
  '/orders/{id}': {
    get: { summary: 'Get one order', requestParams: byId, responses: ok('The order', OrderSchema) },
    put: {
      summary: 'Replace customer, items and prices (before shipping)',
      requestParams: byId,
      requestBody: body(UpdateOrderRequestSchema),
      responses: ok('Updated', OrderSchema),
    },
    delete: {
      summary: 'Delete an order (before shipping)',
      requestParams: byId,
      responses: { '204': { description: 'Deleted' } },
    },
  },
  '/orders/{id}/status': {
    post: {
      summary: 'Move the order to another status',
      requestParams: byId,
      requestBody: body(ChangeStatusRequestSchema),
      responses: ok('Updated', OrderSchema),
    },
  },
  '/orders/{id}/history': {
    get: {
      summary: 'Who changed what, newest first',
      requestParams: byId,
      responses: ok('History', OrderHistoryResponseSchema),
    },
  },
  '/orders/bulk': {
    post: {
      summary: 'Apply one action to up to 500 orders',
      requestBody: body(BulkOrdersRequestSchema),
      responses: ok('Per-order result', BulkOrdersResponseSchema),
    },
  },
  '/orders/ship': {
    post: {
      summary: 'Hand confirmed orders to a carrier; parcels are created in the background',
      requestBody: body(ShipOrdersRequestSchema),
      responses: {
        '202': {
          description: 'Per-order result',
          content: { 'application/json': { schema: ShipOrdersResponseSchema } },
        },
      },
    },
  },
};
