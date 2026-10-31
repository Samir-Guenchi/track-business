import { z } from 'zod';
import { OrderSchema } from '../orders/order.schema.js';
import { CallAttemptSchema } from './call-attempt.schema.js';
import { ScriptLanguageSchema } from './confirmation-settings.schema.js';

/** How long `GET /confirmation/next` reserves an order for one agent. */
export const QUEUE_LOCK_SECONDS = 5 * 60;

/** `GET /confirmation/next?language=`: which script the agent reads (default Arabic). */
export const NextCallQuerySchema = z.strictObject({
  language: ScriptLanguageSchema.default('ar'),
});
export type NextCallQuery = z.infer<typeof NextCallQuerySchema>;

/**
 * `GET /confirmation/next`: the next order for the calling agent, locked to them for 5 minutes.
 * Order: call-backs that are due first, then the oldest `new` / `to_confirm` / `unreachable` order.
 * Orders locked by another agent, or outside the agent's assignment rules, are skipped.
 * `item` is null when the queue is empty for this agent.
 */
export const NextCallResponseSchema = z.strictObject({
  item: z
    .strictObject({
      order: OrderSchema,
      lockedUntil: z.iso.datetime(),
      attemptsToday: z.number().int().min(0),
      previousAttempts: z.array(CallAttemptSchema).max(20),
      /** The store's script in the agent's language, with placeholders already filled. */
      script: z.string().nullable(),
    })
    .nullable(),
});
export type NextCallResponse = z.infer<typeof NextCallResponseSchema>;

/** `POST /confirmation/orders/:id/release`: give an order back without logging a call. */
export const ReleaseLockResponseSchema = z.strictObject({ released: z.boolean() });
