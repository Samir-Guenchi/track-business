import { z } from 'zod';
import { DeliveryTypeSchema } from '../orders/order.schema.js';
import { CarrierCodeSchema } from '../pricing/pricing.schema.js';
import { PAYOUT_LINES_MAX } from './payout.schema.js';

const Dzd = z.number().int().nonnegative();

/**
 * `POST /internal/stores/:storeId/carrier-fees` on shipping (ADR-0004): what the carrier's rate
 * card says each parcel should cost, for the fee audit in payments (#196).
 */
export const ExpectedFeesRequestSchema = z.strictObject({
  carrier: CarrierCodeSchema,
  trackingNumbers: z.array(z.string().min(1).max(60)).min(1).max(PAYOUT_LINES_MAX),
});
export type ExpectedFeesRequest = z.infer<typeof ExpectedFeesRequestSchema>;

/** Parcels shipping does not know are left out; a fee is null when the rate card is unclear. */
export const ExpectedFeesResponseSchema = z.strictObject({
  items: z.array(
    z.strictObject({
      trackingNumber: z.string(),
      toWilayaCode: z.number().int().nullable(),
      deliveryType: DeliveryTypeSchema.nullable(),
      deliveryFee: Dzd.nullable(),
      returnFee: Dzd.nullable(),
    }),
  ),
});
export type ExpectedFeesResponse = z.infer<typeof ExpectedFeesResponseSchema>;

export const FEE_ISSUES = [
  /** Delivery fee above the rate card for this wilaya and delivery type. */
  'delivery_fee_above_rate',
  'return_fee_above_rate',
  /** A return fee on a parcel the same line says was paid for (cash collected). */
  'return_fee_on_delivered',
  /** The same parcel charged twice on one statement. */
  'charged_twice',
] as const;
export const FeeIssueSchema = z.enum(FEE_ISSUES);
export type FeeIssue = z.infer<typeof FeeIssueSchema>;

export const FeeAuditLineSchema = z.strictObject({
  trackingNumber: z.string(),
  issue: FeeIssueSchema,
  charged: Dzd,
  /** What the rate card says; null for issues that do not depend on it. */
  expected: Dzd.nullable(),
  overcharge: Dzd,
});
export type FeeAuditLine = z.infer<typeof FeeAuditLineSchema>;

/** `GET /payouts/:id/fee-audit`: the statement's fees checked against the carrier's rate card. */
export const FeeAuditSchema = z.strictObject({
  payoutId: z.uuid(),
  carrier: z.string(),
  lines: z.number().int().nonnegative(),
  /** Lines whose fees could be compared with a rate card. */
  checked: z.number().int().nonnegative(),
  overchargedTotal: Dzd,
  issues: z.array(FeeAuditLineSchema),
  /** False when shipping could not be reached: only the rate-free checks ran. */
  rateCardChecked: z.boolean(),
});
export type FeeAudit = z.infer<typeof FeeAuditSchema>;
