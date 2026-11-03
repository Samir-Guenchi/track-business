import { z } from 'zod';
import { FailedAttemptReasonSchema } from '../tracking/parcel-status.js';

/**
 * Failed attempts the customer can confirm or deny (#195): reasons that claim the courier
 * reached, or tried to reach, the customer. A wrong address is not the customer's word to give.
 */
export const CHECKABLE_ATTEMPT_REASONS = ['absent', 'no_answer', 'phone_off', 'refused'] as const;

export const AttemptAnswerSchema = z.enum(['contacted', 'not_contacted']);
export type AttemptAnswer = z.infer<typeof AttemptAnswerSchema>;

/** `GET /public/tracking/:code/attempt-check`: the latest checkable attempt, if any. */
export const PublicAttemptCheckSchema = z.strictObject({
  check: z
    .strictObject({
      eventId: z.uuid(),
      at: z.iso.datetime(),
      reason: FailedAttemptReasonSchema,
      answer: AttemptAnswerSchema.nullable(),
    })
    .nullable(),
});
export type PublicAttemptCheck = z.infer<typeof PublicAttemptCheckSchema>;

/** `POST /public/tracking/:code/attempt-check`: one answer per attempt, never changed. */
export const AnswerAttemptCheckSchema = z.strictObject({
  eventId: z.uuid(),
  answer: AttemptAnswerSchema,
});
export type AnswerAttemptCheck = z.infer<typeof AnswerAttemptCheckSchema>;

export const AttemptChecksQuerySchema = z.strictObject({
  days: z.coerce.number().int().min(1).max(180).default(30),
});
export type AttemptChecksQuery = z.infer<typeof AttemptChecksQuerySchema>;

export const DisputedAttemptSchema = z.strictObject({
  shipmentId: z.uuid(),
  orderId: z.uuid(),
  carrier: z.string(),
  trackingNumber: z.string(),
  toWilayaCode: z.number().int().nullable(),
  reason: FailedAttemptReasonSchema,
  attemptAt: z.iso.datetime(),
  answeredAt: z.iso.datetime(),
});
export type DisputedAttempt = z.infer<typeof DisputedAttemptSchema>;

/** `GET /attempt-checks`: per carrier, how often customers say the courier never came. */
export const AttemptChecksReportSchema = z.strictObject({
  carriers: z.array(
    z.strictObject({
      carrier: z.string(),
      answered: z.number().int().min(0),
      disputed: z.number().int().min(0),
    }),
  ),
  disputed: z.array(DisputedAttemptSchema),
});
export type AttemptChecksReport = z.infer<typeof AttemptChecksReportSchema>;

export const ATTEMPT_CHECK_EVENTS = {
  disputed: 'shipping.attempt.disputed.v1',
} as const;

/** The customer says nobody came or called: orders raises it in the follow-up queue (#132). */
export const AttemptDisputedEventSchema = z.strictObject({
  shipmentId: z.uuid(),
  orderId: z.uuid(),
  carrier: z.string(),
  reason: FailedAttemptReasonSchema,
  attemptAt: z.iso.datetime(),
});
export type AttemptDisputedEvent = z.infer<typeof AttemptDisputedEventSchema>;
