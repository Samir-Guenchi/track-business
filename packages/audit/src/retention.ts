/** Retention policy, documented in docs/audit-log.md. */
export const AUDIT_RETENTION = {
  /** Audit events are deleted after this many days (24 months). */
  eventsDays: 730,
  /** IP addresses are personal data (law 18-07): cleared after 90 days, the event stays. */
  ipDays: 90,
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface RetentionCutoffs {
  /** Delete events that occurred before this instant. */
  readonly deleteEventsBefore: Date;
  /** Set `ip` to null on events that occurred before this instant. */
  readonly clearIpBefore: Date;
}

/** Pure, so the purge job (one per service, daily) is trivial to test. */
export function retentionCutoffs(now: Date): RetentionCutoffs {
  return {
    deleteEventsBefore: new Date(now.getTime() - AUDIT_RETENTION.eventsDays * DAY_MS),
    clearIpBefore: new Date(now.getTime() - AUDIT_RETENTION.ipDays * DAY_MS),
  };
}
