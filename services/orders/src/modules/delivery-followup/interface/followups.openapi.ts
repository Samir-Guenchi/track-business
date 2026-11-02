import {
  DecideFollowupRequestSchema,
  DeliveryFollowupSchema,
  FollowupMetricsQuerySchema,
  FollowupMetricsResponseSchema,
  ListFollowupsQuerySchema,
  ListFollowupsResponseSchema,
} from '@trackecom/contracts';
import type { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

const json = (description: string, schema: z.ZodType) => ({
  description,
  content: { 'application/json': { schema } },
});

export const followupsOpenApiPaths: ZodOpenApiPathsObject = {
  '/orders/followups': {
    get: {
      summary: 'Failed-delivery queue: parcels to decide on, most urgent first (#132)',
      requestParams: { query: ListFollowupsQuerySchema },
      responses: { '200': json('Page of follow-ups', ListFollowupsResponseSchema) },
    },
  },
  '/orders/followups/metrics': {
    get: {
      summary: 'Recovered and returned parcels per carrier and failure reason',
      requestParams: { query: FollowupMetricsQuerySchema },
      responses: { '200': json('Recovery metrics', FollowupMetricsResponseSchema) },
    },
  },
  '/orders/followups/{id}/decision': {
    post: {
      summary: 'Reattempt, switch to a stop-desk or return; sent to shipping as an event',
      requestBody: { content: { 'application/json': { schema: DecideFollowupRequestSchema } } },
      responses: {
        '200': json('The decided follow-up', DeliveryFollowupSchema),
        '409': { description: 'The parcel was already delivered or returned' },
      },
    },
  },
};
