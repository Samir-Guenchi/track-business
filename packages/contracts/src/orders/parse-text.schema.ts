import { z } from 'zod';
import { MAX_LOCATE_TEXT } from '../geo/place-locate.schema.js';

/** `POST /orders/parse-text`: a pasted chat message to pre-fill the order form (#193). */
export const ParseOrderTextRequestSchema = z.strictObject({
  text: z.string().trim().min(2).max(MAX_LOCATE_TEXT),
});
export type ParseOrderTextRequest = z.infer<typeof ParseOrderTextRequestSchema>;

/**
 * Suggestions only: nothing is stored and the agent checks every field before saving.
 * `rest` is what the parser could not place (product, size, street...), never thrown away.
 */
export const ParseOrderTextResponseSchema = z.strictObject({
  name: z.string().nullable(),
  /** E.164 (`+213551234567`). */
  phone: z.string().nullable(),
  phone2: z.string().nullable(),
  wilayaCode: z.number().int().nullable(),
  communeId: z.number().int().nullable(),
  /** 0..1, how sure the commune match is; null when no place was found. */
  placeScore: z.number().min(0).max(1).nullable(),
  address: z.string().nullable(),
  quantity: z.number().int().min(1).nullable(),
  rest: z.string().nullable(),
});
export type ParseOrderTextResponse = z.infer<typeof ParseOrderTextResponseSchema>;
