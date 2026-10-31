import { z } from 'zod';
import { OrderStatusSchema } from '../orders/order-status.js';

/** What happened on one confirmation call. */
export const CallOutcomeSchema = z.enum([
  'confirmed',
  'no_answer',
  'busy',
  'wrong_number',
  'cancelled',
  'postponed',
  'call_back',
]);
export type CallOutcome = z.infer<typeof CallOutcomeSchema>;

/** Outcomes that count as "did not reach the customer" towards the unreachable limit. */
export const UNREACHED_OUTCOMES: readonly CallOutcome[] = ['no_answer', 'busy'];

const note = z.string().trim().max(500).optional();
/** Seconds the call lasted, measured by the agent's screen (or the phone integration later). */
const durationSec = z
  .number()
  .int()
  .min(0)
  .max(4 * 60 * 60);
const base = { orderId: z.uuid(), note, durationSec };

/**
 * `POST /confirmation/calls`: the agent logs the result of a call on an order they hold the lock on.
 * Cancelling needs a reason; postponing needs the date and time the order should come back.
 */
export const LogCallRequestSchema = z.discriminatedUnion('outcome', [
  z.strictObject({
    ...base,
    outcome: z.enum(['confirmed', 'no_answer', 'busy', 'wrong_number']),
  }),
  z.strictObject({
    ...base,
    outcome: z.literal('cancelled'),
    reason: z.string().trim().min(1).max(300),
  }),
  z.strictObject({
    ...base,
    outcome: z.literal('postponed'),
    callBackAt: z.iso.datetime({ offset: true }),
  }),
  /** "Call me back later": optional time; without one the order goes back to the normal queue. */
  z.strictObject({
    ...base,
    outcome: z.literal('call_back'),
    callBackAt: z.iso.datetime({ offset: true }).optional(),
  }),
]);
export type LogCallRequest = z.infer<typeof LogCallRequestSchema>;

export const CallAttemptSchema = z.strictObject({
  id: z.uuid(),
  orderId: z.uuid(),
  agentId: z.uuid(),
  outcome: CallOutcomeSchema,
  reason: z.string().nullable(),
  note: z.string().nullable(),
  callBackAt: z.iso.datetime().nullable(),
  durationSec: z.number().int(),
  at: z.iso.datetime(),
});
export type CallAttempt = z.infer<typeof CallAttemptSchema>;

/** `POST /confirmation/calls` response: the attempt, and the order status it led to. */
export const LogCallResponseSchema = z.strictObject({
  attempt: CallAttemptSchema,
  /** e.g. `unreachable` once the store's attempt limit is reached. */
  orderStatus: OrderStatusSchema,
});
export type LogCallResponse = z.infer<typeof LogCallResponseSchema>;
