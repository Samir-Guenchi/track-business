import {
  ImportPayoutRequestSchema,
  ListPayoutsQuerySchema,
  ListPayoutsResponseSchema,
  PayoutSchema,
} from '@trackecom/contracts';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

export const payoutsOpenApiPaths: ZodOpenApiPathsObject = {
  '/payouts': {
    get: {
      summary: 'Imported statements, newest payment first',
      requestParams: { query: ListPayoutsQuerySchema },
      responses: {
        '200': {
          description: 'Page of payouts',
          content: { 'application/json': { schema: ListPayoutsResponseSchema } },
        },
      },
    },
    post: {
      summary: 'Import one carrier statement; it is matched in the background',
      requestBody: { content: { 'application/json': { schema: ImportPayoutRequestSchema } } },
      responses: {
        '202': {
          description: 'Stored, status processing',
          content: { 'application/json': { schema: PayoutSchema } },
        },
        '400': { description: 'Invalid statement or a tracking number listed twice' },
        '409': { description: 'This statement was already imported' },
      },
    },
  },
  '/payouts/{id}': {
    get: {
      summary: 'One statement and how many of its lines matched',
      responses: {
        '200': { description: 'Payout', content: { 'application/json': { schema: PayoutSchema } } },
        '404': { description: 'No such statement in this store' },
      },
    },
  },
};
