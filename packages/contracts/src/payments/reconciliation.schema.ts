import { z } from 'zod';
import { CursorQuerySchema, cursorPage } from '../common/pagination.schema.js';

/**
 * Where each parcel's money stands (#42). Every delivered parcel ends `matched` or flagged
 * (`amount_mismatch`, `missing`); payout lines without a parcel are `unknown_line`.
 */
export const RECONCILIATION_STATUSES = [
  'awaiting_delivery',
  'awaiting_payout',
  'matched',
  'amount_mismatch',
  'missing',
  'returned',
  'unknown_line',
] as const;
export const ReconciliationStatusSchema = z.enum(RECONCILIATION_STATUSES);
export type ReconciliationStatus = z.infer<typeof ReconciliationStatusSchema>;

/** Statuses a person must look at: they go to the claim list sent to the carrier. */
export const FLAGGED_STATUSES: readonly ReconciliationStatus[] = [
  'amount_mismatch',
  'missing',
  'unknown_line',
];

export const ParcelMoneySchema = z.strictObject({
  carrier: z.string(),
  trackingNumber: z.string(),
  orderId: z.uuid().nullable(),
  status: ReconciliationStatusSchema,
  expectedCod: z.number().int().nonnegative().nullable(),
  receivedCod: z.number().int().nonnegative().nullable(),
  fees: z.number().int().nonnegative(),
  deliveredAt: z.iso.datetime().nullable(),
  payoutId: z.uuid().nullable(),
});
export type ParcelMoney = z.infer<typeof ParcelMoneySchema>;

export const ListParcelMoneyQuerySchema = CursorQuerySchema.extend({
  status: ReconciliationStatusSchema.optional(),
  carrier: z.string().optional(),
});
export type ListParcelMoneyQuery = z.infer<typeof ListParcelMoneyQuerySchema>;

export const ListParcelMoneyResponseSchema = cursorPage(ParcelMoneySchema);
export type ListParcelMoneyResponse = z.infer<typeof ListParcelMoneyResponseSchema>;

/**
 * `GET /money/summary`: the store's ledger. Double entry, so
 * `expected = received + fees + outstanding + written off` always holds.
 */
export const MoneySummarySchema = z.strictObject({
  /** COD of delivered parcels: what carriers owe in total. */
  expected: z.number().int(),
  received: z.number().int(),
  fees: z.number().int(),
  /** Owed and not paid yet (awaiting payout + missing + short payments). */
  outstanding: z.number().int(),
  flaggedParcels: z.number().int().nonnegative(),
});
export type MoneySummary = z.infer<typeof MoneySummarySchema>;

/** Store settings: when an unpaid delivered parcel becomes `missing`. */
export const MoneySettingsSchema = z.strictObject({
  missingAfterDays: z.number().int().min(1).max(90).default(14),
});
export type MoneySettings = z.infer<typeof MoneySettingsSchema>;
