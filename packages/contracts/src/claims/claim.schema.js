import { z } from 'zod';
/**
 * Why a seller claims against a carrier (#139):
 * - `stuck`: no tracking event for days on a parcel that is not final;
 * - `return_missing`: the carrier says returned, but the parcel never reached the seller;
 * - `damaged`: the parcel came back damaged or incomplete;
 * - `lost`: the carrier admits it lost the parcel.
 */
export const ClaimReasonSchema = z.enum(['stuck', 'return_missing', 'damaged', 'lost']);
/** open: being prepared; submitted: sent to the carrier; won/rejected: the carrier answered. */
export const ClaimStateSchema = z.enum(['open', 'submitted', 'won', 'rejected']);
/** Defaults the candidate scan uses; a store can ask with its own values. */
export const CLAIM_DEFAULTS = { stuckDays: 10, returnMissingDays: 7 };
/** A parcel that looks claimable and has no claim yet. */
export const ClaimCandidateSchema = z.strictObject({
  shipmentId: z.uuid(),
  orderId: z.uuid(),
  carrier: z.string(),
  trackingNumber: z.string(),
  reason: ClaimReasonSchema,
  status: z.string(),
  /** Last tracking event, or the scan date for a damaged return. */
  since: z.iso.datetime(),
});
export const ListClaimCandidatesQuerySchema = z.strictObject({
  stuckDays: z.coerce.number().int().min(3).max(60).default(CLAIM_DEFAULTS.stuckDays),
  returnMissingDays: z.coerce
    .number()
    .int()
    .min(3)
    .max(60)
    .default(CLAIM_DEFAULTS.returnMissingDays),
});
export const ListClaimCandidatesResponseSchema = z.strictObject({
  items: z.array(ClaimCandidateSchema),
});
/** Amounts are whole dinars. */
const Dinars = z.number().int().min(0).max(10_000_000);
export const CreateClaimRequestSchema = z.strictObject({
  shipmentId: z.uuid(),
  reason: ClaimReasonSchema,
  /** What the goods were worth; the web pre-fills it with the order subtotal. */
  declaredValue: Dinars,
  note: z.string().trim().max(1000).optional(),
});
export const UpdateClaimRequestSchema = z.strictObject({
  state: ClaimStateSchema,
  /** What the carrier paid back; only with `won`. */
  recovered: Dinars.optional(),
  note: z.string().trim().max(1000).optional(),
});
