import type {
  DeliveryFollowup,
  FailedAttemptReason,
  FollowupDecision,
  FollowupMetric,
  FollowupOutcome,
  FollowupStatus,
} from '@trackecom/contracts';
import type { DeliveryFollowup as Row } from '../../../generated/prisma/client.js';
import type { FollowupRecord } from '../domain/followup.js';

/** Columns hold contract enums as text; they are only ever written from typed records. */
export function toRecord(row: Row): FollowupRecord {
  return {
    ...row,
    reason: row.reason as FailedAttemptReason,
    status: row.status as FollowupStatus,
    decision: row.decision as FollowupDecision | null,
    outcome: row.outcome as FollowupOutcome | null,
  };
}

export function toDto(record: FollowupRecord): DeliveryFollowup {
  return {
    id: record.id,
    orderId: record.orderId,
    orderRef: record.orderRef,
    customerName: record.customerName,
    wilayaCode: record.wilayaCode,
    shipmentId: record.shipmentId,
    carrier: record.carrier,
    trackingNumber: record.trackingNumber,
    reason: record.reason,
    attempts: record.attempts,
    lastAttemptAt: record.lastAttemptAt.toISOString(),
    dueAt: record.dueAt.toISOString(),
    status: record.status,
    decision: record.decision,
    stopDeskId: record.stopDeskId,
    note: record.note,
    decidedBy: record.decidedBy,
    decidedAt: record.decidedAt?.toISOString() ?? null,
    outcome: record.outcome,
  };
}

export interface MetricGroup {
  readonly carrier: string;
  readonly reason: string;
  readonly outcome: string | null;
  readonly count: number;
}

/** Folds (carrier, reason, outcome) counts into one row per carrier and reason. */
export function toMetrics(groups: readonly MetricGroup[]): FollowupMetric[] {
  const rows = new Map<
    string,
    { carrier: string; reason: string; failed: number; recovered: number; returned: number }
  >();
  for (const group of groups) {
    const key = `${group.carrier}|${group.reason}`;
    const row = rows.get(key) ?? {
      carrier: group.carrier,
      reason: group.reason,
      failed: 0,
      recovered: 0,
      returned: 0,
    };
    row.failed += group.count;
    if (group.outcome === 'delivered') row.recovered += group.count;
    if (group.outcome === 'returned') row.returned += group.count;
    rows.set(key, row);
  }
  return [...rows.values()].map((row) => {
    const ended = row.recovered + row.returned;
    return {
      ...row,
      reason: row.reason as FailedAttemptReason,
      recoveryRate: ended === 0 ? null : row.recovered / ended,
    };
  });
}
