import { z } from 'zod';
import { ReturnConditionSchema } from './return.schema.js';

export const RETURN_EVENTS = {
  /** The seller scanned a returned parcel in a batch: stock (#45) and the order can follow. */
  received: 'shipping.return.received.v1',
} as const;

export const ReturnReceivedEventSchema = z.strictObject({
  shipmentId: z.string(),
  orderId: z.string(),
  batchId: z.string(),
  carrier: z.string(),
  trackingNumber: z.string(),
  condition: ReturnConditionSchema,
  receivedAt: z.iso.datetime(),
});
export type ReturnReceivedEvent = z.infer<typeof ReturnReceivedEventSchema>;
