import {
  BlacklistEntrySchema,
  CreateBlacklistEntryRequestSchema,
  ListBlacklistQuerySchema,
  ListBlacklistResponseSchema,
} from '@trackecom/contracts';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

export const fraudOpenApiPaths: ZodOpenApiPathsObject = {
  '/blacklist': {
    get: {
      summary: "The store's blacklist, newest first; ?phone= finds a number in any spelling",
      requestParams: { query: ListBlacklistQuerySchema },
      responses: {
        '200': {
          description: 'Page of entries',
          content: { 'application/json': { schema: ListBlacklistResponseSchema } },
        },
      },
    },
    post: {
      summary: 'Blacklist a phone, or a name in one commune (orders.write)',
      requestBody: {
        content: { 'application/json': { schema: CreateBlacklistEntryRequestSchema } },
      },
      responses: {
        '201': {
          description: 'Entry',
          content: { 'application/json': { schema: BlacklistEntrySchema } },
        },
      },
    },
  },
  '/blacklist/{id}': {
    delete: {
      summary: 'Remove an entry (the appeal path)',
      responses: { '204': { description: 'Removed' }, '404': { description: 'No such entry' } },
    },
  },
};
