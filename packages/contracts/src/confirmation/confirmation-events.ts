import { z } from 'zod';
import { CallOutcomeSchema } from './call-attempt.schema.js';

/** Published by the orders service (which owns confirmation, ADR-0001) through its outbox. */
export const CONFIRMATION_EVENTS = {
  callLogged: 'orders.call.logged.v1',
} as const;

/** Feeds agent stats, best-time-to-call (#54) and the risk score (#50). No phone number inside. */
export const CallLoggedEventSchema = z.strictObject({
  attemptId: z.string(),
  orderId: z.string(),
  agentId: z.string(),
  outcome: CallOutcomeSchema,
  durationSec: z.number().int(),
  at: z.iso.datetime(),
});
export type CallLoggedEvent = z.infer<typeof CallLoggedEventSchema>;
