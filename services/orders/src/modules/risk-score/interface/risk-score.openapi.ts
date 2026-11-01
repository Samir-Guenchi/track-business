import { RiskScoreSchema } from '@trackecom/contracts';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

export const riskScoreOpenApiPaths: ZodOpenApiPathsObject = {
  '/orders/{id}/risk-score': {
    get: {
      summary: 'Return-risk score (0-100) with its top three reasons in AR/FR/EN (orders.read)',
      responses: {
        '200': {
          description: 'Score',
          content: { 'application/json': { schema: RiskScoreSchema } },
        },
        '404': { description: 'No such order in this store' },
      },
    },
  },
};
