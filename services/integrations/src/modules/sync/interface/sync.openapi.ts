import {
  PendingShopOrdersResponseSchema,
  ResolvePendingOrderRequestSchema,
  SkipPendingOrderRequestSchema,
} from '@trackecom/contracts';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { z } from 'zod';

const body = (schema: z.ZodType) => ({ content: { 'application/json': { schema } } });
const done = { '204': { description: 'Done' } };

export const syncOpenApiPaths: ZodOpenApiPathsObject = {
  '/integrations/orders/needs-fix': {
    get: {
      summary: 'Shop orders held back (currency, phone, address), oldest first',
      responses: {
        '200': { description: 'Pending', ...body(PendingShopOrdersResponseSchema) },
      },
    },
  },
  '/integrations/orders/needs-fix/resolve': {
    post: {
      summary: 'Place the customer (and fix the phone) so the order is imported',
      requestBody: body(ResolvePendingOrderRequestSchema),
      responses: done,
    },
  },
  '/integrations/orders/needs-fix/skip': {
    post: {
      summary: 'Never import this shop order',
      requestBody: body(SkipPendingOrderRequestSchema),
      responses: done,
    },
  },
  '/webhooks/shops/{connectionId}': {
    post: {
      summary: 'Order events from a shop, checked by its signature (no login)',
      requestParams: { path: z.object({ connectionId: z.uuid() }) },
      responses: {
        '200': { description: 'Received', ...body(z.object({ received: z.number() })) },
      },
    },
  },
};
