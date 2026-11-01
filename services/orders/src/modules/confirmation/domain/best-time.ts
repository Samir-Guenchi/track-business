import type { BestTime } from '@trackecom/contracts';

/** Calls placed during one Algiers hour, and how many reached the customer. */
export interface HourlyAttempts {
  readonly hour: number;
  readonly attempts: number;
  readonly answered: number;
}

export interface HourlyRate {
  readonly hour: number;
  readonly attempts: number;
  readonly rate: number;
}

/** Agents call between 08:00 and 21:59; other hours are never suggested. */
export const CALLING_HOURS = Array.from({ length: 14 }, (_, i) => i + 8);
/** Minimum history before a basis is trusted: a customer, or a wilaya / the whole store. */
export const MIN_CUSTOMER_ATTEMPTS = 3;
export const MIN_GROUP_ATTEMPTS = 30;
/** An hour is only suggested from this many calls in it. */
const MIN_HOUR_ATTEMPTS = 5;
/** Weight, in calls, of the overall rate mixed into each hour (Bayesian smoothing). */
const PRIOR_CALLS = 5;
/** A retry is moved to the best hour only when it beats the current one by this much. */
export const RETRY_GAIN = 0.15;

const HOUR_MS = 3_600_000;

/** Each calling hour's answer rate, pulled towards the overall rate when it has few calls. */
export function hourlyRates(rows: readonly HourlyAttempts[]): HourlyRate[] {
  const attempts = rows.reduce((sum, row) => sum + row.attempts, 0);
  const answered = rows.reduce((sum, row) => sum + row.answered, 0);
  const overall = attempts === 0 ? 0 : answered / attempts;
  return CALLING_HOURS.map((hour) => {
    const row = rows.find((candidate) => candidate.hour === hour);
    const calls = row?.attempts ?? 0;
    const rate = ((row?.answered ?? 0) + overall * PRIOR_CALLS) / (calls + PRIOR_CALLS);
    return { hour, attempts: calls, rate: Math.round(rate * 1000) / 1000 };
  });
}

/** Algiers is UTC+1 all year. */
export const algiersHour = (at: Date): number => (at.getUTCHours() + 1) % 24;

/** The hour with the best answer rate, or null when no hour has enough calls. */
export function bestTime(
  rows: readonly HourlyAttempts[],
  basis: BestTime['basis'],
  now: Date,
): BestTime | null {
  const rates = hourlyRates(rows);
  // One customer's history is short: any hour they were called in counts.
  const minimum = basis === 'customer' ? 1 : MIN_HOUR_ATTEMPTS;
  const candidates = rates.filter((rate) => rate.attempts >= minimum);
  const best = candidates.reduce<HourlyRate | null>(
    (top, rate) => (top === null || rate.rate > top.rate ? rate : top),
    null,
  );
  if (!best) return null;
  const current = rates.find((rate) => rate.hour === algiersHour(now));
  return { bestHour: best.hour, bestRate: best.rate, rateNow: current?.rate ?? null, basis };
}

/**
 * When to try an unreached customer again: the next start of the best hour, if it beats the
 * current hour by RETRY_GAIN; otherwise null (the order goes back in the queue as before).
 */
export function retryAt(best: BestTime | null, now: Date): Date | null {
  if (!best || best.rateNow === null || best.bestRate - best.rateNow < RETRY_GAIN) return null;
  const hoursAhead = (best.bestHour - algiersHour(now) + 24) % 24 || 24;
  const startOfHour = Math.floor(now.getTime() / HOUR_MS) * HOUR_MS;
  return new Date(startOfHour + hoursAhead * HOUR_MS);
}
