import { z } from 'zod';
import { WilayaCodeSchema } from '../geo/wilaya.schema.js';
import { DeliveryTypeSchema } from '../orders/order.schema.js';
import { CarrierCodeSchema } from '../pricing/pricing.schema.js';

/**
 * `GET /carriers/suggestion` (#41): which connected carrier to use for one parcel, and why.
 * The ship dialog shows the suggestion; the seller can still pick another carrier.
 */
export const SuggestCarrierQuerySchema = z.strictObject({
  originWilayaCode: WilayaCodeSchema,
  wilayaCode: WilayaCodeSchema,
  deliveryType: DeliveryTypeSchema,
});
export type SuggestCarrierQuery = z.infer<typeof SuggestCarrierQuerySchema>;

/** Why a carrier was suggested; the app turns the code into one translated line. */
export const SUGGESTION_REASONS = [
  'routing_rule',
  'only_option',
  'cheapest',
  'most_reliable',
  'fastest',
  'best_balance',
] as const;
export const SuggestionReasonSchema = z.enum(SUGGESTION_REASONS);
export type SuggestionReason = z.infer<typeof SuggestionReasonSchema>;

/** Why a connected carrier cannot take this parcel. */
export const UNAVAILABLE_REASONS = ['no_rate', 'no_stopdesk'] as const;

const Rate = z.number().min(0).max(1);

export const CarrierOptionSchema = z.strictObject({
  carrier: z.string(),
  /** The carrier's cost from the store's rate card, in DZD; null without a rate. */
  cost: z.number().int().nonnegative().nullable(),
  /** Share of this store's parcels to the wilaya the carrier delivered (last 90 days). */
  storeDeliveryRate: Rate.nullable(),
  storeParcels: z.number().int().nonnegative(),
  /** Same, across all stores; only shown when enough stores shipped there (anonymised). */
  networkDeliveryRate: Rate.nullable(),
  averageDeliveryDays: z.number().nonnegative().nullable(),
  /** 0-100 with the store's weights; null when the carrier cannot take the parcel. */
  score: z.number().min(0).max(100).nullable(),
  unavailable: z.enum(UNAVAILABLE_REASONS).nullable(),
});
export type CarrierOption = z.infer<typeof CarrierOptionSchema>;

export const CarrierSuggestionSchema = z.strictObject({
  /** null when no connected carrier can take the parcel. */
  suggested: z.string().nullable(),
  reason: SuggestionReasonSchema.nullable(),
  /** Best first; unavailable carriers last. */
  options: z.array(CarrierOptionSchema),
});
export type CarrierSuggestion = z.infer<typeof CarrierSuggestionSchema>;

const Weight = z.number().int().min(0).max(10);

/** "wilaya 16 -> carrier A": the first rule listing the destination wins over the score. */
export const RoutingRuleSchema = z.strictObject({
  wilayaCodes: z.array(WilayaCodeSchema).min(1).max(99),
  carrier: CarrierCodeSchema,
});
export type RoutingRule = z.infer<typeof RoutingRuleSchema>;

/** `GET/PUT /carriers/suggestion-settings`: cheapest vs most reliable, and routing rules. */
export const SuggestionSettingsSchema = z.strictObject({
  weights: z
    .strictObject({ price: Weight, reliability: Weight, speed: Weight })
    .refine((w) => w.price + w.reliability + w.speed > 0, 'At least one weight must be set')
    .default({ price: 5, reliability: 5, speed: 2 }),
  rules: z.array(RoutingRuleSchema).max(50).default([]),
});
export type SuggestionSettings = z.infer<typeof SuggestionSettingsSchema>;
