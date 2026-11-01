/** Algiers is UTC+1 all year. */
const OFFSET_HOURS = 1;
const HOUR_MS = 3_600_000;

export interface QuietHours {
  readonly start: number;
  readonly end: number;
}

const algiersHour = (at: Date): number => (at.getUTCHours() + OFFSET_HOURS) % 24;

/** True when `hour` falls in the window, which may wrap past midnight (21 -> 8). */
export function isQuiet(hour: number, quiet: QuietHours): boolean {
  if (quiet.start === quiet.end) return false;
  return quiet.start < quiet.end
    ? hour >= quiet.start && hour < quiet.end
    : hour >= quiet.start || hour < quiet.end;
}

/** Now, or the next time the store's quiet hours end (on the hour, Algiers time). */
export function sendTime(now: Date, quiet: QuietHours): Date {
  const hour = algiersHour(now);
  if (!isQuiet(hour, quiet)) return now;
  const hoursAhead = (quiet.end - hour + 24) % 24 || 24;
  const startOfHour = Math.floor(now.getTime() / HOUR_MS) * HOUR_MS;
  return new Date(startOfHour + hoursAhead * HOUR_MS);
}
