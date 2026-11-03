import { BenchmarkQuerySchema, BenchmarkResponseSchema } from '@trackecom/contracts';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

export const benchmarksOpenApiPaths: ZodOpenApiPathsObject = {
  '/benchmarks': {
    get: {
      summary: 'Delivery rate per wilaya and carrier next to the anonymous market (#200)',
      requestParams: { query: BenchmarkQuerySchema },
      responses: {
        '200': {
          description: 'Own and market figures; market null below the threshold',
          content: { 'application/json': { schema: BenchmarkResponseSchema } },
        },
      },
    },
  },
};
