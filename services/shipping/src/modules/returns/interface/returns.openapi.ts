import {
  CreateReturnBatchRequestSchema,
  ListExpectedReturnsQuerySchema,
  ListExpectedReturnsResponseSchema,
  ListReturnBatchesQuerySchema,
  ListReturnBatchesResponseSchema,
  ReturnBatchSchema,
  ReturnSummaryQuerySchema,
  ReturnSummaryResponseSchema,
} from '@trackecom/contracts';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { z } from 'zod';

const json = (status: string, description: string, schema: z.ZodType) => ({
  [status]: { description, content: { 'application/json': { schema } } },
});

export const returnsOpenApiPaths: ZodOpenApiPathsObject = {
  '/returns/expected': {
    get: {
      summary: 'Parcels the carrier sent back that the seller has not received, oldest first',
      requestParams: { query: ListExpectedReturnsQuerySchema },
      responses: json('200', 'Expected returns', ListExpectedReturnsResponseSchema),
    },
  },
  '/returns/summary': {
    get: {
      summary: 'Expected and overdue returns per carrier',
      requestParams: { query: ReturnSummaryQuerySchema },
      responses: json('200', 'Counts per carrier', ReturnSummaryResponseSchema),
    },
  },
  '/returns/batches': {
    get: {
      summary: 'Past hand-overs, newest first',
      requestParams: { query: ListReturnBatchesQuerySchema },
      responses: json('200', 'Return batches', ListReturnBatchesResponseSchema),
    },
    post: {
      summary: 'Receive what a courier hands back (scan), flagging unknown and missing numbers',
      requestBody: { content: { 'application/json': { schema: CreateReturnBatchRequestSchema } } },
      responses: {
        ...json('201', 'The batch, as a manifest', ReturnBatchSchema),
        '409': { description: 'Another scan received one of these parcels meanwhile' },
      },
    },
  },
  '/returns/batches/{id}': {
    get: {
      summary: 'One hand-over with every parcel received',
      requestParams: { path: z.object({ id: z.uuid() }) },
      responses: {
        ...json('200', 'The batch', ReturnBatchSchema),
        '404': { description: 'Unknown' },
      },
    },
  },
};
