import { z } from 'zod';
import { ClaimReasonSchema, ClaimStateSchema } from './claim.schema.js';

export const ClaimSchema = z.strictObject({
  id: z.uuid(),
  shipmentId: z.uuid(),
  orderId: z.uuid(),
  carrier: z.string(),
  trackingNumber: z.string(),
  reason: ClaimReasonSchema,
  state: ClaimStateSchema,
  declaredValue: z.number().int(),
  recovered: z.number().int().nullable(),
  note: z.string().nullable(),
  createdAt: z.iso.datetime(),
  submittedAt: z.iso.datetime().nullable(),
  closedAt: z.iso.datetime().nullable(),
});
export type Claim = z.infer<typeof ClaimSchema>;

export const ListClaimsQuerySchema = z.strictObject({
  state: ClaimStateSchema.optional(),
  carrier: z.string().max(40).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type ListClaimsQuery = z.infer<typeof ListClaimsQuerySchema>;

export const ListClaimsResponseSchema = z.strictObject({ items: z.array(ClaimSchema) });
export type ListClaimsResponse = z.infer<typeof ListClaimsResponseSchema>;

/** The claim letter, ready to print or paste in an e-mail to the carrier. */
export const ClaimLetterQuerySchema = z.strictObject({
  lang: z.enum(['fr', 'ar']).default('fr'),
});
export type ClaimLetterQuery = z.infer<typeof ClaimLetterQuerySchema>;

export const ClaimLetterSchema = z.strictObject({
  subject: z.string(),
  body: z.string(),
});
export type ClaimLetter = z.infer<typeof ClaimLetterSchema>;
