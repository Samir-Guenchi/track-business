import {
  CreateDeliveryRequestSchema,
  DeliveryChoicesSchema,
  DeliveryRequestSchema,
  ListDeliveryRequestsQuerySchema,
  ListDeliveryRequestsResponseSchema,
  UpdateDeliveryRequestSchema,
} from '@trackecom/contracts';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import type { z } from 'zod';

const json = (status: string, description: string, schema: z.ZodType) => ({
  [status]: { description, content: { 'application/json': { schema } } },
});
const body = (schema: z.ZodType) => ({ content: { 'application/json': { schema } } });

export const deliveryRequestsOpenApiPaths: ZodOpenApiPathsObject = {
  '/public/tracking/{publicCode}/choices': {
    get: {
      summary: 'What the customer can still change on this parcel, and the stop-desk price change',
      responses: json('200', 'Delivery choices', DeliveryChoicesSchema),
    },
  },
  '/public/tracking/{publicCode}/requests': {
    post: {
      summary: 'The customer asks for another day, a stop-desk, an address fix or a call time',
      requestBody: body(CreateDeliveryRequestSchema),
      responses: json('201', 'Request taken; the choices as they now stand', DeliveryChoicesSchema),
    },
  },
  '/delivery-requests': {
    get: {
      summary: 'Customer requests, newest first, filtered by state or order',
      requestParams: { query: ListDeliveryRequestsQuerySchema },
      responses: json('200', 'Delivery requests', ListDeliveryRequestsResponseSchema),
    },
  },
  '/delivery-requests/{id}': {
    patch: {
      summary: 'Mark a pending request as passed to the carrier, or dismiss it',
      requestBody: body(UpdateDeliveryRequestSchema),
      responses: json('200', 'The request', DeliveryRequestSchema),
    },
  },
};
