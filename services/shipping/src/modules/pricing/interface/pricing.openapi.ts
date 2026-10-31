import {
  CarrierCodeSchema,
  RateCardRowSchema,
  ReplaceRateCardRequestSchema,
  ShippingQuoteQuerySchema,
  ShippingQuoteSchema,
  StorePricesResponseSchema,
  UpdateStorePricesRequestSchema,
} from '@trackecom/contracts';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { z } from 'zod';

const json = (description: string, schema: z.ZodType) => ({
  '200': { description, content: { 'application/json': { schema } } },
});
const body = (schema: z.ZodType) => ({ content: { 'application/json': { schema } } });
const carrierPath = { path: z.object({ carrier: CarrierCodeSchema }) };

export const pricingOpenApiPaths: ZodOpenApiPathsObject = {
  '/pricing/store-prices': {
    get: {
      summary: "The store's selling price for every wilaya and delivery type",
      responses: json(
        '69 wilayas x 2 delivery types, missing prices as null',
        StorePricesResponseSchema,
      ),
    },
    put: {
      summary: 'Bulk edit selling prices and the free shipping rule',
      requestBody: body(UpdateStorePricesRequestSchema),
      responses: json('The full grid after the change', StorePricesResponseSchema),
    },
  },
  '/pricing/quote': {
    get: {
      summary: 'The shipping fee the order form shows live',
      requestParams: { query: ShippingQuoteQuerySchema },
      responses: json('Fee, or not available', ShippingQuoteSchema),
    },
  },
  '/pricing/rate-cards/{carrier}': {
    get: {
      summary: "A carrier's costs for the store",
      requestParams: carrierPath,
      responses: json('Rate card rows', z.object({ rows: z.array(RateCardRowSchema) })),
    },
    put: {
      summary: "Replace a carrier's costs (carrier API or Excel import)",
      requestParams: carrierPath,
      requestBody: body(ReplaceRateCardRequestSchema),
      responses: json('Rows imported', z.object({ carrier: z.string(), rows: z.number() })),
    },
  },
};
