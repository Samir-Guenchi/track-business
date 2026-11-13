import { ParseOrderTextRequestSchema, ParseOrderTextResponseSchema } from '@trackecom/contracts';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

export const smartPasteOpenApiPaths: ZodOpenApiPathsObject = {
  '/orders/parse-text': {
    post: {
      summary: 'Suggest order form fields from a pasted chat message (#193)',
      requestBody: { content: { 'application/json': { schema: ParseOrderTextRequestSchema } } },
      responses: {
        '200': {
          description: 'Suggestions; nothing is stored',
          content: { 'application/json': { schema: ParseOrderTextResponseSchema } },
        },
      },
    },
  },
};
