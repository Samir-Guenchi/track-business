import { z } from 'zod';
import { WilayaCodeSchema } from '../geo/wilaya.schema.js';

/**
 * How orders are spread between agents:
 * - `round_robin`: any agent takes the next order;
 * - `rules`: an agent only gets orders matching their wilayas or products (empty rule = all).
 */
export const AssignmentModeSchema = z.enum(['round_robin', 'rules']);

export const AgentRuleSchema = z.strictObject({
  agentId: z.uuid(),
  wilayaCodes: z.array(WilayaCodeSchema).max(69).default([]),
  productIds: z.array(z.string().min(1)).max(200).default([]),
});
export type AgentRule = z.infer<typeof AgentRuleSchema>;

/** `GET` / `PUT /confirmation/settings` (store.update to change). */
export const ConfirmationSettingsSchema = z.strictObject({
  assignment: AssignmentModeSchema.default('round_robin'),
  agentRules: z.array(AgentRuleSchema).max(100).default([]),
  /** An order is not offered again the same day once it reached this many attempts. */
  maxAttemptsPerDay: z.number().int().min(1).max(20).default(3),
  /** After this many unreached calls in total the order moves to `unreachable`. */
  unreachableAfter: z.number().int().min(1).max(50).default(6),
});
export type ConfirmationSettings = z.infer<typeof ConfirmationSettingsSchema>;

export const ScriptLanguageSchema = z.enum(['ar', 'fr', 'darija']);
export type ScriptLanguage = z.infer<typeof ScriptLanguageSchema>;

/**
 * `PUT /confirmation/scripts/:language`: the call script. Placeholders the server fills:
 * `{customerName}`, `{orderRef}`, `{items}`, `{total}` (amount to collect), `{wilaya}` (code).
 */
export const CallScriptSchema = z.strictObject({
  language: ScriptLanguageSchema,
  body: z.string().trim().min(1).max(4000),
});
export type CallScript = z.infer<typeof CallScriptSchema>;

/** `GET /confirmation/scripts`: the store's scripts, one per language that has one. */
export const CallScriptsResponseSchema = z.strictObject({ items: z.array(CallScriptSchema) });
export type CallScriptsResponse = z.infer<typeof CallScriptsResponseSchema>;

/** Body of `PUT /confirmation/scripts/:language`. */
export const UpdateCallScriptRequestSchema = CallScriptSchema.pick({ body: true });
