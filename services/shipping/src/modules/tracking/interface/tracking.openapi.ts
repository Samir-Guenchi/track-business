import {
  OrderTrackingResponseSchema,
  PublicCodeSchema,
  PublicTrackingResponseSchema,
} from '@trackecom/contracts';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { z } from 'zod';

const json = (description: string, schema: z.ZodType) => ({
  '200': { description, content: { 'application/json': { schema } } },
});

export const trackingOpenApiPaths: ZodOpenApiPathsObject = {
  '/tracking/orders/{orderId}': {
    get: {
      summary: "An order's parcels, newest first, each with its timeline",
      requestParams: { path: z.object({ orderId: z.uuid() }) },
      responses: json('Shipments and events', OrderTrackingResponseSchema),
    },
  },
  '/public/tracking/{publicCode}': {
    get: {
      summary: 'Customer tracking page data (no login, no personal data)',
      requestParams: { path: z.object({ publicCode: PublicCodeSchema }) },
      responses: {
        ...json('Parcel status and timeline', PublicTrackingResponseSchema),
        '404': { description: 'Unknown code' },
      },
    },
  },
};
