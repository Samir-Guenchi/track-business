import { z } from 'zod';
import { CommuneSchema } from './commune.schema.js';

export const MAX_GEO_SEARCH_RESULTS = 10;

/** `GET /geo/search?q=bab zouar&limit=5`: Arabic, French or Latin-script Darija spellings. */
export const GeoSearchQuerySchema = z.strictObject({
  q: z.string().trim().min(2).max(60),
  wilayaCode: z.coerce.number().int().min(1).max(99).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_GEO_SEARCH_RESULTS).default(5),
});

export type GeoSearchQuery = z.infer<typeof GeoSearchQuerySchema>;

export const GeoSearchResponseSchema = z.strictObject({
  items: z.array(z.strictObject({ commune: CommuneSchema, score: z.number().min(0).max(1) })),
});

export type GeoSearchResponse = z.infer<typeof GeoSearchResponseSchema>;
