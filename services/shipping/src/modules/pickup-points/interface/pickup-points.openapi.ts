import {
  DropParcelSchema,
  HandoverResponseSchema,
  ListPickupParcelsResponseSchema,
  ListPickupPointsResponseSchema,
  PickupParcelStateSchema,
  PickupPointInputSchema,
  PickupPointSchema,
  PickupStatementQuerySchema,
  PickupStatementSchema,
  PublicPickupSchema,
  ReleaseParcelSchema,
} from '@trackecom/contracts';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { z } from 'zod';

const ok = (status: '200' | '201', description: string, schema: z.ZodType) => ({
  [status]: { description, content: { 'application/json': { schema } } },
});
const body = (schema: z.ZodType) => ({ content: { 'application/json': { schema } } });
const point = { path: z.object({ id: z.uuid() }) };

export const pickupPointsOpenApiPaths: ZodOpenApiPathsObject = {
  '/public/tracking/{publicCode}/pickup': {
    get: {
      summary: 'The partner shop holding the parcel and the code to give it (#202)',
      requestParams: { path: z.object({ publicCode: z.string() }) },
      responses: ok('200', 'Pickup point, or null', PublicPickupSchema),
    },
  },
  '/pickup-points': {
    get: {
      summary: 'Partner pickup points with what each holds and the cash to collect',
      responses: ok('200', 'The points', ListPickupPointsResponseSchema),
    },
    post: {
      summary: 'Register a partner shop',
      requestBody: body(PickupPointInputSchema),
      responses: ok('201', 'The new point', PickupPointSchema),
    },
  },
  '/pickup-points/{id}': {
    patch: {
      summary: 'Edit a partner shop (send every field)',
      requestParams: point,
      requestBody: body(PickupPointInputSchema),
      responses: ok('200', 'The point', PickupPointSchema),
    },
  },
  '/pickup-points/{id}/parcels': {
    get: {
      summary: 'Parcels at the point, newest first',
      requestParams: { ...point, query: z.object({ state: PickupParcelStateSchema.optional() }) },
      responses: ok('200', 'The parcels', ListPickupParcelsResponseSchema),
    },
    post: {
      summary: 'The courier left a parcel at the point; a pickup code is created',
      requestParams: point,
      requestBody: body(DropParcelSchema),
      responses: ok('201', 'Parcels waiting at the point', ListPickupParcelsResponseSchema),
    },
  },
  '/pickup-points/{id}/parcels/{shipmentId}/release': {
    post: {
      summary: 'Hand the parcel to the customer against their code (locked after 5 wrong codes)',
      requestParams: { path: z.object({ id: z.uuid(), shipmentId: z.uuid() }) },
      requestBody: body(ReleaseParcelSchema),
      responses: ok('201', 'Parcels at the point', ListPickupParcelsResponseSchema),
    },
  },
  '/pickup-points/{id}/handover': {
    post: {
      summary: 'The shop handed the collected cash to the seller',
      requestParams: point,
      responses: ok('201', 'Parcels and cash handed over now', HandoverResponseSchema),
    },
  },
  '/pickup-points/{id}/statement': {
    get: {
      summary: 'Released parcels, fees owed and cash for a month',
      requestParams: { ...point, query: PickupStatementQuerySchema },
      responses: ok('200', 'The statement', PickupStatementSchema),
    },
  },
};
