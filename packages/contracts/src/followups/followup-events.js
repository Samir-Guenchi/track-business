import { z } from 'zod';
import { FollowupDecisionSchema } from './followup.schema.js';
export const FOLLOWUP_EVENTS = {
  /** The seller chose what happens to a parcel after a failed attempt. */
  decided: 'orders.followup.decided.v1',
};
/** Shipping pushes it to the carrier when the carrier's API allows it, else lists it for them. */
export const FollowupDecidedEventSchema = z.strictObject({
  followupId: z.string(),
  orderId: z.string(),
  shipmentId: z.string(),
  carrier: z.string(),
  trackingNumber: z.string(),
  decision: FollowupDecisionSchema,
  stopDeskId: z.string().nullable(),
});
