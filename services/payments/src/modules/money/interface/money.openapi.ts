import { ImportPayoutRequestSchema, MoneySummarySchema, PayoutSchema } from '@trackecom/contracts';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

export const moneyOpenApiPaths: ZodOpenApiPathsObject = {
  '/money/summary': {
    get: {
      summary: "The store's COD ledger: expected, received, fees, outstanding, flagged parcels",
      responses: {
        '200': {
          description: 'Summary',
          content: { 'application/json': { schema: MoneySummarySchema } },
        },
      },
    },
  },
  '/payouts': {
    post: {
      summary: 'Import one carrier statement; it is matched in the background',
      requestBody: { content: { 'application/json': { schema: ImportPayoutRequestSchema } } },
      responses: {
        '202': {
          description: 'Stored, status processing',
          content: { 'application/json': { schema: PayoutSchema } },
        },
        '409': { description: 'This statement was already imported' },
        '400': { description: 'Invalid statement or a tracking number listed twice' },
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
