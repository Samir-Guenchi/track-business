import { z } from 'zod';

/** `GET /confirmation/stats?from&to`: per-agent numbers for the period (default: today). */
export const AgentStatsQuerySchema = z.strictObject({
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
});
export type AgentStatsQuery = z.infer<typeof AgentStatsQuerySchema>;

export const AgentStatsSchema = z.strictObject({
  agentId: z.uuid(),
  calls: z.number().int().min(0),
  callsPerHour: z.number().min(0),
  confirmed: z.number().int().min(0),
  /** confirmed / orders with a final outcome (confirmed or cancelled), 0 to 1. */
  confirmRate: z.number().min(0).max(1),
  averageHandleSec: z.number().min(0),
});
export type AgentStats = z.infer<typeof AgentStatsSchema>;

export const AgentStatsResponseSchema = z.strictObject({
  from: z.iso.datetime(),
  to: z.iso.datetime(),
  items: z.array(AgentStatsSchema),
});
export type AgentStatsResponse = z.infer<typeof AgentStatsResponseSchema>;
