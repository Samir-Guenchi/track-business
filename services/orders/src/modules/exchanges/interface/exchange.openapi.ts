import { CreateExchangeRequestSchema, OrderSchema } from '@trackecom/contracts';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

export const exchangeOpenApiPaths: ZodOpenApiPathsObject = {
  '/orders/{id}/exchange': {
    post: {
      summary: 'Create an exchange order from a delivered order (size or colour swap)',
      requestBody: { content: { 'application/json': { schema: CreateExchangeRequestSchema } } },
      responses: {
        '201': {
          description: 'The new exchange order',
          content: { 'application/json': { schema: OrderSchema } },
        },
      },
    },
  },
};
