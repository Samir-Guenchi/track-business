import {
  ListStopDesksQuerySchema,
  ListStopDesksResponseSchema,
  SyncStopDesksResponseSchema,
} from '@trackecom/contracts';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import type { z } from 'zod';

const json = (status: string, description: string, schema: z.ZodType) => ({
  [status]: { description, content: { 'application/json': { schema } } },
});

export const stopDesksOpenApiPaths: ZodOpenApiPathsObject = {
  '/geo/stop-desks': {
    get: {
      summary: 'Stop-desks by wilaya, commune or near a point, nearest first (public)',
      requestParams: { query: ListStopDesksQuerySchema },
      responses: json('200', 'Stop-desks', ListStopDesksResponseSchema),
    },
  },
  '/stop-desks/sync/{carrier}': {
    post: {
      summary: "Pull the carrier's stop-desk list with this store's credentials",
      responses: json(
        '200',
        'What was saved and what did not match a commune',
        SyncStopDesksResponseSchema,
      ),
    },
  },
};
