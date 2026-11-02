import {
  ConnectShopRequestSchema,
  ConnectorsResponseSchema,
  IntegrationSchema,
  IntegrationsResponseSchema,
} from '@trackecom/contracts';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { z } from 'zod';

const json = (description: string, schema: z.ZodType) => ({
  '200': { description, content: { 'application/json': { schema } } },
});

export const connectionsOpenApiPaths: ZodOpenApiPathsObject = {
  '/integrations/connectors': {
    get: {
      summary: 'Shop platforms TrackEcom can import orders from',
      responses: json('Connectors', ConnectorsResponseSchema),
    },
  },
  '/integrations': {
    get: {
      summary: 'Shops this store connected, with their sync status (no credentials)',
      responses: json('Shops', IntegrationsResponseSchema),
    },
    post: {
      summary: 'Connect a shop; credentials are checked with the shop, then encrypted',
      requestBody: { content: { 'application/json': { schema: ConnectShopRequestSchema } } },
      responses: json('Connected shop', IntegrationSchema),
    },
  },
  '/integrations/{id}': {
    delete: {
      summary: 'Disconnect a shop and delete its credentials',
      requestParams: { path: z.object({ id: z.uuid() }) },
      responses: { '204': { description: 'Deleted' } },
    },
  },
};
