import { z } from 'zod';
import { CursorQuerySchema, cursorPage } from '../common/pagination.schema.js';
import { FailedAttemptReasonSchema } from '../tracking/parcel-status.js';

/**
 * Failed-delivery follow-up (#132). Each failed attempt opens (or reopens) one item per parcel;
 * the seller decides before the courier's next run, and the item closes when the parcel ends.
 */
export const FOLLOWUP_STATUSES = ['open', 'decided', 'closed'] as const;
export const FollowupStatusSchema = z.enum(FOLLOWUP_STATUSES);
export type FollowupStatus = z.infer<typeof FollowupStatusSchema>;

export const FOLLOWUP_DECISIONS = ['reattempt', 'switch_to_stopdesk', 'return'] as const;
export const FollowupDecisionSchema = z.enum(FOLLOWUP_DECISIONS);
export type FollowupDecision = z.infer<typeof FollowupDecisionSchema>;

/** How the parcel ended once the item closed. */
export const FollowupOutcomeSchema = z.enum(['delivered', 'returned']);
export type FollowupOutcome = z.infer<typeof FollowupOutcomeSchema>;

export const DeliveryFollowupSchema = z.strictObject({
  id: z.uuid(),
  orderId: z.string(),
  orderRef: z.string(),
  customerName: z.string(),
  wilayaCode: z.number().int(),
  shipmentId: z.string(),
  carrier: z.string(),
  trackingNumber: z.string(),
  reason: FailedAttemptReasonSchema,
  attempts: z.number().int().min(1),
  lastAttemptAt: z.iso.datetime(),
  /** Decide before this time: the courier's next run (default 24 h after the attempt). */
  dueAt: z.iso.datetime(),
  status: FollowupStatusSchema,
  decision: FollowupDecisionSchema.nullable(),
  stopDeskId: z.string().nullable(),
  note: z.string().nullable(),
  decidedBy: z.string().nullable(),
  decidedAt: z.iso.datetime().nullable(),
  outcome: FollowupOutcomeSchema.nullable(),
});
export type DeliveryFollowup = z.infer<typeof DeliveryFollowupSchema>;

/** `GET /orders/followups`: oldest due first, so the most urgent parcel is on top. */
export const ListFollowupsQuerySchema = CursorQuerySchema.extend({
  status: FollowupStatusSchema.optional(),
  reason: FailedAttemptReasonSchema.optional(),
  wilayaCode: z.coerce.number().int().min(1).max(99).optional(),
  carrier: z.string().min(1).max(40).optional(),
  /** `true`: only open items past their due time. */
  overdue: z.stringbool().optional(),
});
export type ListFollowupsQuery = z.infer<typeof ListFollowupsQuerySchema>;

export const ListFollowupsResponseSchema = cursorPage(DeliveryFollowupSchema);
export type ListFollowupsResponse = z.infer<typeof ListFollowupsResponseSchema>;

/** `POST /orders/followups/:id/decision`. A stop-desk switch needs the desk. */
export const DecideFollowupRequestSchema = z
  .strictObject({
    decision: FollowupDecisionSchema,
    stopDeskId: z.string().trim().min(1).max(60).optional(),
    note: z.string().trim().max(500).optional(),
  })
  .refine((body) => body.decision !== 'switch_to_stopdesk' || Boolean(body.stopDeskId), {
    message: 'A stop-desk switch needs a stopDeskId',
    path: ['stopDeskId'],
  });
export type DecideFollowupRequest = z.infer<typeof DecideFollowupRequestSchema>;

/** One row of `GET /orders/followups/metrics`: recovery per carrier and reason. */
export const FollowupMetricSchema = z.strictObject({
  carrier: z.string(),
  reason: FailedAttemptReasonSchema,
  failed: z.number().int(),
  recovered: z.number().int(),
  returned: z.number().int(),
  /** recovered / (recovered + returned), null while nothing has ended yet. */
  recoveryRate: z.number().min(0).max(1).nullable(),
});
export type FollowupMetric = z.infer<typeof FollowupMetricSchema>;

export const FollowupMetricsQuerySchema = z.strictObject({
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
});
export type FollowupMetricsQuery = z.infer<typeof FollowupMetricsQuerySchema>;

export const FollowupMetricsResponseSchema = z.strictObject({
  items: z.array(FollowupMetricSchema),
});
export type FollowupMetricsResponse = z.infer<typeof FollowupMetricsResponseSchema>;
