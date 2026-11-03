import { FeeAuditSchema } from '@trackecom/contracts';
import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

export const feeAuditOpenApiPaths: ZodOpenApiPathsObject = {
  '/payouts/{id}/fee-audit': {
    get: {
      summary: "Check a payout's carrier fees against the rate card (#196)",
      requestParams: { path: z.object({ id: z.uuid() }) },
      responses: {
        '200': {
          description: 'Overcharged lines and their total',
          content: { 'application/json': { schema: FeeAuditSchema } },
        },
      },
    },
  },
};
