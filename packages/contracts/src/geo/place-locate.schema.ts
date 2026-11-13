import { z } from 'zod';
import { CommuneSchema } from './commune.schema.js';

/** Longest text the locator reads: a pasted chat message, not a document. */
export const MAX_LOCATE_TEXT = 1000;

/** `POST /geo/locate`: find the wilaya and commune a free-text message names (#193). */
export const LocatePlacesRequestSchema = z.strictObject({
  text: z.string().trim().min(2).max(MAX_LOCATE_TEXT),
});
export type LocatePlacesRequest = z.infer<typeof LocatePlacesRequestSchema>;

/** A place found in the text, with the exact words that named it so callers can cut them out. */
export const PlaceMentionSchema = z.strictObject({
  matchedText: z.string().nullable(),
  score: z.number().min(0).max(1),
});

export const LocatePlacesResponseSchema = z.strictObject({
  wilaya: PlaceMentionSchema.extend({ code: z.number().int() }).nullable(),
  commune: PlaceMentionSchema.extend({ commune: CommuneSchema }).nullable(),
});
export type LocatePlacesResponse = z.infer<typeof LocatePlacesResponseSchema>;
