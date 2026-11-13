import {
  CreateReturnRequestSchema,
  DecideReturnRequestSchema,
  ListReturnRequestsQuerySchema,
  ListReturnRequestsResponseSchema,
  PublicReturnStatusSchema,
  SellerReturnRequestSchema,
} from '@trackecom/contracts';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { z } from 'zod';

const ok = (status: '200' | '201', description: string, schema: z.ZodType) => ({
  [status]: { description, content: { 'application/json': { schema } } },
});
const publicCode = { path: z.object({ publicCode: z.string() }) };

export const returnRequestsOpenApiPaths: ZodOpenApiPathsObject = {
  '/public/tracking/{publicCode}/return-request': {
    get: {
      summary: 'Whether the customer can ask for a return or exchange, and the request (#201)',
      requestParams: publicCode,
      responses: ok('200', 'Window and request', PublicReturnStatusSchema),
    },
    post: {
      summary: 'Ask for a return or an exchange of a delivered parcel',
      requestParams: publicCode,
      requestBody: { content: { 'application/json': { schema: CreateReturnRequestSchema } } },
      responses: ok('201', 'The request is in the seller queue', PublicReturnStatusSchema),
    },
  },
  '/return-requests': {
    get: {
      summary: 'Return and exchange requests, newest first',
      requestParams: { query: ListReturnRequestsQuerySchema },
      responses: ok('200', 'The requests', ListReturnRequestsResponseSchema),
    },
  },
  '/return-requests/{id}': {
    patch: {
      summary: 'Accept as exchange, accept as return, or refuse',
      requestParams: { path: z.object({ id: z.uuid() }) },
      requestBody: { content: { 'application/json': { schema: DecideReturnRequestSchema } } },
      responses: ok('200', 'The decided request', SellerReturnRequestSchema),
    },
  },
};
