import { z } from 'zod';

const Hour = z.number().int().min(0).max(23);
const Rate = z.number().min(0).max(1);

/** Whose call history a best-time hint is learnt from: the customer, else the wilaya, else the store. */
export const BEST_TIME_BASES = ['customer', 'wilaya', 'store'] as const;
export const BestTimeBasisSchema = z.enum(BEST_TIME_BASES);

/**
 * When a customer is most likely to answer (#54), learnt from the store's call attempts. Hours are
 * Algiers time. Agents see "best to call after {bestHour}:00".
 */
export const BestTimeSchema = z.strictObject({
  bestHour: Hour,
  /** Smoothed share of calls answered at the best hour. */
  bestRate: Rate,
  /** The same at the current hour; null outside calling hours. */
  rateNow: Rate.nullable(),
  basis: BestTimeBasisSchema,
});
export type BestTime = z.infer<typeof BestTimeSchema>;

/** `GET /confirmation/best-time?wilayaCode=`: the answer rate of each calling hour. */
export const BestTimeQuerySchema = z.strictObject({
  wilayaCode: z.coerce.number().int().min(1).max(99).optional(),
});
export type BestTimeQuery = z.infer<typeof BestTimeQuerySchema>;

export const HourlyAnswerRateSchema = z.strictObject({
  hour: Hour,
  attempts: z.number().int().min(0),
  /** Smoothed towards the overall rate, so an hour with few calls is not over-trusted. */
  rate: Rate,
});

export const BestTimeResponseSchema = z.strictObject({
  hours: z.array(HourlyAnswerRateSchema),
  best: BestTimeSchema.nullable(),
});
export type BestTimeResponse = z.infer<typeof BestTimeResponseSchema>;
