import { z } from 'zod';

/** At least a month: a carrier is judged on a season, not on a bad week. */
export const ScorecardQuerySchema = z.strictObject({
  days: z.coerce.number().int().min(30).max(365).default(90),
});
export type ScorecardQuery = z.infer<typeof ScorecardQuerySchema>;

const Count = z.number().int().min(0);
const Rate = z.number().min(0).max(1).nullable();

/** One carrier's results, for the whole store or one destination wilaya (#139). */
export const CarrierScoreSchema = z.strictObject({
  carrier: z.string(),
  /** null on the store-wide line, and for parcels created before destinations were kept. */
  wilayaCode: z.number().int().nullable(),
  parcels: Count,
  delivered: Count,
  returned: Count,
  /** delivered / (delivered + returned); null until a parcel is final. */
  deliveryRate: Rate,
  /** Days from hand-over to delivery. */
  avgDeliveryDays: z.number().nullable(),
  /** Returned damaged or incomplete, out of returned parcels scanned in. */
  damaged: Count,
  /** Claimed as lost or as a return that never came back. */
  lost: Count,
  claims: Count,
  claimsWon: Count,
  /** Dinars the carrier paid back on won claims. */
  recovered: Count,
});
export type CarrierScore = z.infer<typeof CarrierScoreSchema>;

export const ScorecardResponseSchema = z.strictObject({
  days: z.number().int(),
  /** Store-wide, best delivery rate first. */
  carriers: z.array(CarrierScoreSchema),
  /** Per destination wilaya, ranked inside each wilaya, wilayas in code order. */
  byWilaya: z.array(CarrierScoreSchema),
});
export type ScorecardResponse = z.infer<typeof ScorecardResponseSchema>;
