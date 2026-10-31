import type { AgentStats } from '@trackecom/contracts';

/** What the database sums per agent over the period. */
export interface AgentTotals {
  readonly agentId: string;
  readonly calls: number;
  readonly confirmed: number;
  readonly cancelled: number;
  readonly totalDurationSec: number;
  readonly firstCallAt: Date;
  readonly lastCallAt: Date;
}

const HOUR_MS = 60 * 60 * 1000;
const round = (value: number, digits = 2) => Number(value.toFixed(digits));

/**
 * Calls per hour use the agent's active time (first to last call, at least one hour), so an agent
 * who worked two hours of a long period is not penalised. Confirm rate counts final outcomes only.
 */
export function toAgentStats(totals: AgentTotals): AgentStats {
  const activeHours = Math.max(
    1,
    (totals.lastCallAt.getTime() - totals.firstCallAt.getTime()) / HOUR_MS,
  );
  const decided = totals.confirmed + totals.cancelled;
  return {
    agentId: totals.agentId,
    calls: totals.calls,
    callsPerHour: round(totals.calls / activeHours),
    confirmed: totals.confirmed,
    confirmRate: decided === 0 ? 0 : round(totals.confirmed / decided, 4),
    averageHandleSec: totals.calls === 0 ? 0 : round(totals.totalDurationSec / totals.calls, 1),
  };
}

/** Default period: from midnight in Algiers (UTC+1) to now. */
export function statsPeriod(
  now: Date,
  query: { from?: string | undefined; to?: string | undefined },
) {
  const algiersMidnight = new Date(now.getTime() + HOUR_MS);
  algiersMidnight.setUTCHours(0, 0, 0, 0);
  const from = query.from ? new Date(query.from) : new Date(algiersMidnight.getTime() - HOUR_MS);
  const to = query.to ? new Date(query.to) : now;
  return { from, to };
}
