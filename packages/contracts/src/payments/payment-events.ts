import { z } from 'zod';
import { ReconciliationStatusSchema } from './reconciliation.schema.js';

export const PAYMENT_EVENTS = {
  payoutImported: 'payments.payout.imported.v1',
  parcelFlagged: 'payments.parcel.flagged.v1',
} as const;

export const PayoutImportedEventSchema = z.strictObject({
  payoutId: z.uuid(),
  carrier: z.string(),
  reference: z.string(),
  totalAmount: z.number().int(),
  matched: z.number().int().nonnegative(),
  flagged: z.number().int().nonnegative(),
});
export type PayoutImportedEvent = z.infer<typeof PayoutImportedEventSchema>;

/** A parcel to claim from the carrier; notifications (#37, #46) alert the seller. */
export const ParcelFlaggedEventSchema = z.strictObject({
  carrier: z.string(),
  trackingNumber: z.string(),
  orderId: z.uuid().nullable(),
  status: ReconciliationStatusSchema,
  expectedCod: z.number().int().nullable(),
  receivedCod: z.number().int().nullable(),
});
export type ParcelFlaggedEvent = z.infer<typeof ParcelFlaggedEventSchema>;
