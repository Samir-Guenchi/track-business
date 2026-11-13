import {
  ListResellerOrdersResponseSchema,
  ListResellersResponseSchema,
  ResellerCatalogueSchema,
  ResellerInputSchema,
  ResellerOrderCreatedSchema,
  ResellerOrderRequestSchema,
  ResellerPayoutResponseSchema,
  ResellerPortalSchema,
  ResellerProductInputSchema,
  ResellerProductSchema,
  ResellerSchema,
} from '@trackecom/contracts';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { z } from 'zod';

const ok = (status: '200' | '201', description: string, schema: z.ZodType) => ({
  [status]: { description, content: { 'application/json': { schema } } },
});
const body = (schema: z.ZodType) => ({ content: { 'application/json': { schema } } });
const byId = { path: z.object({ id: z.uuid() }) };
const byCode = { path: z.object({ code: z.string() }) };

export const resellersOpenApiPaths: ZodOpenApiPathsObject = {
  '/resellers': {
    get: {
      summary: 'Resellers with orders, delivery rate and margins (#198)',
      responses: ok('200', 'The resellers', ListResellersResponseSchema),
    },
    post: {
      summary: 'Add a reseller; the answer carries their portal code',
      requestBody: body(ResellerInputSchema),
      responses: ok('201', 'The reseller', ResellerSchema),
    },
  },
  '/resellers/{id}': {
    patch: {
      summary: 'Edit or pause a reseller',
      requestParams: byId,
      requestBody: body(ResellerInputSchema),
      responses: ok('200', 'The reseller', ResellerSchema),
    },
  },
  '/resellers/{id}/orders': {
    get: {
      summary: "A reseller's orders with the margin and its state",
      requestParams: byId,
      responses: ok('200', 'The orders', ListResellerOrdersResponseSchema),
    },
  },
  '/resellers/{id}/payout': {
    post: {
      summary: 'Pay every delivered, unpaid margin of the reseller',
      requestParams: byId,
      responses: ok('201', 'Orders and amount paid now', ResellerPayoutResponseSchema),
    },
  },
  '/resellers/catalogue': {
    get: {
      summary: 'Products offered to resellers',
      responses: ok('200', 'The catalogue', ResellerCatalogueSchema),
    },
    post: {
      summary: 'Offer a product to resellers at a supplier price',
      requestBody: body(ResellerProductInputSchema),
      responses: ok('201', 'The product', ResellerProductSchema),
    },
  },
  '/resellers/catalogue/{id}': {
    patch: {
      summary: 'Edit or pause a reseller product',
      requestParams: byId,
      requestBody: body(ResellerProductInputSchema),
      responses: ok('200', 'The product', ResellerProductSchema),
    },
  },
  '/public/resellers/{code}': {
    get: {
      summary: "The reseller's portal: catalogue, own orders and margins",
      requestParams: byCode,
      responses: ok('200', 'The portal', ResellerPortalSchema),
    },
  },
  '/public/resellers/{code}/orders': {
    post: {
      summary: "Send a customer's order; it joins the supplier's confirmation queue",
      requestParams: byCode,
      requestBody: body(ResellerOrderRequestSchema),
      responses: ok(
        '201',
        'The order ref, amount to collect and margin',
        ResellerOrderCreatedSchema,
      ),
    },
  },
};
