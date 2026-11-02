import {
  ConfirmationLinkSchema,
  SelfConfirmRequestSchema,
  SelfConfirmResponseSchema,
  SelfConfirmViewSchema,
  ShareLocationRequestSchema,
} from '@trackecom/contracts';
import type { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

const json = (description: string, schema: z.ZodType) => ({
  description,
  content: { 'application/json': { schema } },
});

export const selfConfirmOpenApiPaths: ZodOpenApiPathsObject = {
  '/orders/{id}/confirmation-link': {
    post: {
      summary: 'One-time link (72 h) the customer opens to confirm, cancel or fix the address',
      responses: { '201': json('Link', ConfirmationLinkSchema) },
    },
  },
  '/public/confirm/{token}': {
    get: {
      summary: 'Public: the order as the customer sees it (no login, token only)',
      responses: {
        '200': json('Order summary', SelfConfirmViewSchema),
        '404': { description: 'Unknown or expired link' },
      },
    },
    post: {
      summary: 'Public: confirm, cancel, or change the address and confirm (once)',
      requestBody: { content: { 'application/json': { schema: SelfConfirmRequestSchema } } },
      responses: {
        '200': json('New order status', SelfConfirmResponseSchema),
        '409': { description: 'Link already used, or the order is past confirmation' },
      },
    },
  },
  '/public/confirm/{token}/location': {
    post: {
      summary: 'Public: drop or move a map pin, with an optional landmark (#135)',
      requestBody: { content: { 'application/json': { schema: ShareLocationRequestSchema } } },
      responses: {
        '204': { description: 'Saved on the order' },
        '409': { description: 'The parcel is delivered, returned or cancelled' },
      },
    },
  },
};
