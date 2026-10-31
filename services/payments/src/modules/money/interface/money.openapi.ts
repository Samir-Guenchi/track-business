import { MoneySummarySchema } from '@trackecom/contracts';
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
};
