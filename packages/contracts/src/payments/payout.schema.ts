import { z } from 'zod';
import { CarrierCodeSchema } from '../pricing/pricing.schema.js';

/** Most lines one statement may carry; carriers pay weekly, a big seller has a few thousand. */
export const PAYOUT_LINES_MAX = 5_000;

const Dzd = z.number().int().nonnegative();

/** One parcel on a carrier's payout statement. Amounts in DZD. */
export const PayoutLineInputSchema = z.strictObject({
  trackingNumber: z.string().trim().min(1).max(60),
  /** Cash collected from the customer. */
  codAmount: Dzd,
  shippingFee: Dzd,
  /** Charged when the parcel came back instead of being delivered. */
  returnFee: Dzd,
});
export type PayoutLineInput = z.infer<typeof PayoutLineInputSchema>;

/**
 * `POST /payouts`: one carrier statement, from the carrier API or a parsed Excel/PDF file (#42).
 * Importing the same `(carrier, reference)` twice is refused, so a statement counts once.
 */
export const ImportPayoutRequestSchema = z.strictObject({
  carrier: CarrierCodeSchema,
  /** The carrier's own statement id. */
  reference: z.string().trim().min(1).max(80),
  paidAt: z.iso.date(),
  /** What the carrier actually transferred: collected COD minus every fee. */
  totalAmount: z.number().int(),
  lines: z.array(PayoutLineInputSchema).min(1).max(PAYOUT_LINES_MAX),
});
export type ImportPayoutRequest = z.infer<typeof ImportPayoutRequestSchema>;

export const PayoutSchema = z.strictObject({
  id: z.uuid(),
  carrier: z.string(),
  reference: z.string(),
  paidAt: z.iso.date(),
  totalAmount: z.number().int(),
  codAmount: Dzd,
  fees: Dzd,
  /** totalAmount minus (codAmount - fees): non-zero means the transfer itself does not add up. */
  transferGap: z.number().int(),
  lines: z.number().int().nonnegative(),
  matched: z.number().int().nonnegative(),
  flagged: z.number().int().nonnegative(),
  importedAt: z.iso.datetime(),
});
export type Payout = z.infer<typeof PayoutSchema>;
