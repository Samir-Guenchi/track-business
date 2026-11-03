import { z } from 'zod';

/**
 * After delivery, the customer asks to send the parcel back or swap an item (#201), from the
 * tracking page, within the store's window. One request per parcel.
 */
export const RETURN_REQUEST_WINDOW_DAYS = 7;

export const ReturnRequestKindSchema = z.enum(['exchange', 'return']);
export type ReturnRequestKind = z.infer<typeof ReturnRequestKindSchema>;

export const ReturnRequestReasonSchema = z.enum([
  'wrong_size',
  'wrong_colour',
  'defective',
  'not_as_described',
  'changed_mind',
  'other',
]);
export type ReturnRequestReason = z.infer<typeof ReturnRequestReasonSchema>;

export const ReturnRequestStateSchema = z.enum([
  'pending',
  'accepted_exchange',
  'accepted_return',
  'refused',
]);
export type ReturnRequestState = z.infer<typeof ReturnRequestStateSchema>;

/** `POST /public/tracking/:code/return-request`. */
export const CreateReturnRequestSchema = z.strictObject({
  kind: ReturnRequestKindSchema,
  reason: ReturnRequestReasonSchema,
  /** For an exchange: what the customer wants instead, e.g. "taille L" or "rouge". */
  wanted: z.string().trim().max(120).optional(),
  note: z.string().trim().max(500).optional(),
});
export type CreateReturnRequest = z.infer<typeof CreateReturnRequestSchema>;

export const PublicReturnRequestSchema = z.strictObject({
  kind: ReturnRequestKindSchema,
  reason: ReturnRequestReasonSchema,
  wanted: z.string().nullable(),
  note: z.string().nullable(),
  state: ReturnRequestStateSchema,
  /** What the seller wrote with the decision, shown to the customer. */
  sellerMessage: z.string().nullable(),
  createdAt: z.iso.datetime(),
  decidedAt: z.iso.datetime().nullable(),
  /** Tracking link code of the exchange parcel, once it is shipped. */
  newTrackingCode: z.string().nullable(),
});
export type PublicReturnRequest = z.infer<typeof PublicReturnRequestSchema>;

/** `GET /public/tracking/:code/return-request`. */
export const PublicReturnStatusSchema = z.strictObject({
  /** True when the parcel is delivered, inside the window and has no request yet. */
  canRequest: z.boolean(),
  /** Last day a request is accepted, when the parcel is delivered. */
  deadline: z.iso.datetime().nullable(),
  request: PublicReturnRequestSchema.nullable(),
});
export type PublicReturnStatus = z.infer<typeof PublicReturnStatusSchema>;
