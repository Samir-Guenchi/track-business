import { StuckParcelsQuerySchema, StuckParcelsResponseSchema } from '@trackecom/contracts';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

export const stuckParcelsOpenApiPaths: ZodOpenApiPathsObject = {
  '/stuck-parcels': {
    get: {
      summary: 'Parcels with no tracking news for too long, and carrier x wilaya hotspots (#197)',
      requestParams: { query: StuckParcelsQuerySchema },
      responses: {
        '200': {
          description: 'Longest idle first',
          content: { 'application/json': { schema: StuckParcelsResponseSchema } },
        },
      },
    },
  },
};
