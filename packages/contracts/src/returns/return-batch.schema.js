import { z } from 'zod';
import { CursorQuerySchema, cursorPage } from '../common/pagination.schema.js';
import { CarrierCodeSchema } from '../pricing/pricing.schema.js';
import { ReturnConditionSchema } from './return.schema.js';
export const MAX_RETURN_BATCH_SIZE = 500;
const TrackingNumberSchema = z.string().trim().min(3).max(60);
export const ScannedReturnSchema = z.strictObject({
  trackingNumber: TrackingNumberSchema,
  condition: ReturnConditionSchema.default('intact'),
});
/**
 * `POST /returns/batches`: what the courier hands back. `declared` is the courier's own list
 * (bordereau); anything declared but not scanned is flagged missing on the manifest.
 */
export const CreateReturnBatchRequestSchema = z.strictObject({
  carrier: CarrierCodeSchema,
  scanned: z.array(ScannedReturnSchema).min(1).max(MAX_RETURN_BATCH_SIZE),
  declared: z.array(TrackingNumberSchema).max(MAX_RETURN_BATCH_SIZE).optional(),
  courierName: z.string().trim().min(1).max(120).optional(),
  note: z.string().trim().max(500).optional(),
});
export const ReceivedReturnSchema = z.strictObject({
  shipmentId: z.string(),
  orderId: z.string(),
  trackingNumber: z.string(),
  condition: ReturnConditionSchema,
  /** The carrier had not said the parcel was going back (still flagged on the manifest). */
  unannounced: z.boolean(),
});
export const ReturnBatchSchema = z.strictObject({
  id: z.uuid(),
  carrier: z.string(),
  courierName: z.string().nullable(),
  note: z.string().nullable(),
  receivedBy: z.string(),
  createdAt: z.iso.datetime(),
  received: z.array(ReceivedReturnSchema),
  /** Declared by the courier but not in the scan. */
  missing: z.array(z.string()),
  /** Scanned numbers that match no parcel of this store and carrier. */
  unknown: z.array(z.string()),
  /** Scanned numbers already received in an earlier batch. */
  alreadyReceived: z.array(z.string()),
});
export const ReturnBatchSummarySchema = ReturnBatchSchema.omit({ received: true }).extend({
  receivedCount: z.number().int(),
});
export const ListReturnBatchesQuerySchema = CursorQuerySchema.extend({
  carrier: CarrierCodeSchema.optional(),
});
export const ListReturnBatchesResponseSchema = cursorPage(ReturnBatchSummarySchema);
