import {
  GeoSearchQuerySchema,
  GeoSearchResponseSchema,
  ListCommunesResponseSchema,
  ListWilayasResponseSchema,
  LocatePlacesRequestSchema,
  LocatePlacesResponseSchema,
  WilayaCodeSchema,
} from '@trackecom/contracts';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import type { z } from 'zod';
import { z as zod } from 'zod';

const json = (description: string, schema: z.ZodType) => ({
  '200': { description, content: { 'application/json': { schema } } },
});

export const geoOpenApiPaths: ZodOpenApiPathsObject = {
  '/geo/wilayas': {
    get: {
      summary: 'List current wilayas',
      responses: json('Wilayas by code', ListWilayasResponseSchema),
    },
  },
  '/geo/wilayas/{code}/communes': {
    get: {
      summary: 'List the communes of a wilaya',
      requestParams: { path: zod.object({ code: WilayaCodeSchema }) },
      responses: json('Communes', ListCommunesResponseSchema),
    },
  },
  '/geo/search': {
    get: {
      summary: 'Fuzzy commune search in Arabic, French and Darija spellings',
      requestParams: { query: GeoSearchQuerySchema },
      responses: json('Best matches first', GeoSearchResponseSchema),
    },
  },
  '/geo/locate': {
    post: {
      summary: 'Find the wilaya and commune named in a pasted message',
      requestBody: { content: { 'application/json': { schema: LocatePlacesRequestSchema } } },
      responses: json('Places found, or null when unsure', LocatePlacesResponseSchema),
    },
  },
};
