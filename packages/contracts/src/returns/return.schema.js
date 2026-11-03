import { z } from 'zod';
import { CursorQuerySchema, cursorPage } from '../common/pagination.schema.js';
import { CarrierCodeSchema } from '../pricing/pricing.schema.js';
import { ParcelStatusSchema } from '../tracking/parcel-status.js';
/**
 * Return-to-seller chain (#133). The carrier says a parcel is going back; the seller scans what
 * the courier actually hands over. Anything still not received after N days is a lost return.
 */
export const DEFAULT_RETURN_OVERDUE_DAYS = 10;
export const ReturnConditionSchema = z.enum(['intact', 'opened', 'damaged', 'incomplete']);
/** A parcel the carrier marked returning or returned that the seller has not received yet. */
export const ExpectedReturnSchema = z.strictObject({
  shipmentId: z.string(),
  orderId: z.string(),
  carrier: z.string(),
  trackingNumber: z.string(),
  wilayaCode: z.number().int().nullable(),
  status: ParcelStatusSchema,
  /** First carrier scan saying the parcel goes back. */
  returnSince: z.iso.datetime(),
  daysWaiting: z.number().int().min(0),
  overdue: z.boolean(),
});
/** `GET /returns/expected`: oldest first, so the most likely lost parcel is on top. */
export const ListExpectedReturnsQuerySchema = CursorQuerySchema.extend({
  carrier: CarrierCodeSchema.optional(),
  /** `true`: only parcels waiting longer than `overdueDays`. */
  overdue: z.stringbool().optional(),
  overdueDays: z.coerce.number().int().min(1).max(90).default(DEFAULT_RETURN_OVERDUE_DAYS),
});
export const ListExpectedReturnsResponseSchema = cursorPage(ExpectedReturnSchema);
/** One row of `GET /returns/summary`. */
export const ReturnSummaryRowSchema = z.strictObject({
  carrier: z.string(),
  expected: z.number().int(),
  overdue: z.number().int(),
});
export const ReturnSummaryResponseSchema = z.strictObject({
  overdueDays: z.number().int(),
  carriers: z.array(ReturnSummaryRowSchema),
});
export const ReturnSummaryQuerySchema = ListExpectedReturnsQuerySchema.pick({ overdueDays: true });
