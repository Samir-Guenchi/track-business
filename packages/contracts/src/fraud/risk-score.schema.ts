import { z } from 'zod';

/**
 * Why an order may come back (#50). Each reason carries the numbers its sentence needs, so
 * apps can word it themselves; `text` is a ready sentence in the three app languages.
 */
export const RISK_REASONS = [
  /** This phone's parcels came back at this store before (`count`). */
  'customer_returned_before',
  /** This phone already received parcels at this store (`count`); lowers the score. */
  'customer_delivered_before',
  /** Parcels to this phone were refused at other stores (shared signal, when enabled). */
  'network_refusals',
  /** Many of the store's parcels to this wilaya come back (`rate`, 0 to 1). */
  'wilaya_return_rate',
  /** The amount to collect is high (`amount`, DZD). */
  'high_value',
  /** Ordered between midnight and 6 am, Algiers time. */
  'night_order',
  /** Calls did not reach the customer (`count`). */
  'hard_to_reach',
  /** A fake-order flag from #52 (`flag`). */
  'fake_order_signal',
  /** Looks like a repeat of a recent order from the same phone. */
  'possible_duplicate',
] as const;
export const RiskReasonCodeSchema = z.enum(RISK_REASONS);
export type RiskReasonCode = z.infer<typeof RiskReasonCodeSchema>;

export const RISK_LEVELS = ['low', 'medium', 'high'] as const;
export const RiskLevelSchema = z.enum(RISK_LEVELS);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const RiskReasonSchema = z.strictObject({
  code: RiskReasonCodeSchema,
  /** Points this reason added to the score (negative lowers it). */
  points: z.number().int(),
  params: z.record(z.string(), z.union([z.string(), z.number()])),
  text: z.strictObject({ ar: z.string(), fr: z.string(), en: z.string() }),
});
export type RiskReason = z.infer<typeof RiskReasonSchema>;

/** `GET /orders/:id/risk-score`: 0 (safe) to 100, with the three reasons that weigh most. */
export const RiskScoreSchema = z.strictObject({
  orderId: z.uuid(),
  score: z.number().int().min(0).max(100),
  level: RiskLevelSchema,
  reasons: z.array(RiskReasonSchema).max(3),
  /** Version of the scoring rules, so a stored score can be compared with a later model. */
  model: z.string(),
});
export type RiskScore = z.infer<typeof RiskScoreSchema>;
