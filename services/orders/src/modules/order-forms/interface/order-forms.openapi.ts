import {
  CreateOrderFormRequestSchema,
  FormKeySchema,
  ListOrderFormsResponseSchema,
  OrderFormSchema,
  PublicOrderFormSchema,
  UpdateOrderFormRequestSchema,
} from '@trackecom/contracts';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { z } from 'zod';

const json = (status: string, description: string, schema: z.ZodType) => ({
  [status]: { description, content: { 'application/json': { schema } } },
});
const body = (schema: z.ZodType) => ({ content: { 'application/json': { schema } } });

export const orderFormsOpenApiPaths: ZodOpenApiPathsObject = {
  '/orders/forms': {
    get: {
      summary: "The store's order forms, newest first",
      responses: json('200', 'Order forms', ListOrderFormsResponseSchema),
    },
    post: {
      summary: 'Create an embeddable COD order form with its own public key',
      requestBody: body(CreateOrderFormRequestSchema),
      responses: json('201', 'The new form', OrderFormSchema),
    },
  },
  '/orders/forms/{id}': {
    put: {
      summary: 'Replace a form, or switch it off',
      requestParams: { path: z.object({ id: z.uuid() }) },
      requestBody: body(UpdateOrderFormRequestSchema),
      responses: { ...json('200', 'The form', OrderFormSchema), '404': { description: 'Unknown' } },
    },
  },
  '/public/forms/{key}': {
    get: {
      summary: "A form for the customer's page, with the store's delivery prices (no login)",
      requestParams: { path: z.object({ key: FormKeySchema }) },
      responses: {
        ...json('200', 'Form', PublicOrderFormSchema),
        '404': { description: 'Unknown or switched off' },
      },
    },
  },
};
