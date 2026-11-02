import type {
  FailedAttemptReason,
  FollowupDecision,
  FollowupOutcome,
  FollowupStatus,
  ParcelStatus,
} from '@trackecom/contracts';
import { FollowupClosedError } from './followup.errors.js';

export interface FollowupRecord {
  readonly id: string;
  readonly storeId: string;
  readonly orderId: string;
  readonly orderRef: string;
  readonly customerName: string;
  readonly wilayaCode: number;
  readonly shipmentId: string;
  readonly carrier: string;
  readonly trackingNumber: string;
  readonly reason: FailedAttemptReason;
  readonly attempts: number;
  readonly lastAttemptAt: Date;
  readonly dueAt: Date;
  readonly status: FollowupStatus;
  readonly decision: FollowupDecision | null;
  readonly stopDeskId: string | null;
  readonly note: string | null;
  readonly decidedBy: string | null;
  readonly decidedAt: Date | null;
  readonly outcome: FollowupOutcome | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Couriers usually come back the next working day: decide within this window. */
export const DECISION_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface FailedAttempt {
  readonly reason: FailedAttemptReason;
  readonly at: Date;
}

type NewFollowup = Pick<
  FollowupRecord,
  | 'id'
  | 'storeId'
  | 'orderId'
  | 'orderRef'
  | 'customerName'
  | 'wilayaCode'
  | 'shipmentId'
  | 'carrier'
  | 'trackingNumber'
>;

/** The first failed attempt of a parcel opens its follow-up. */
export function openFollowup(base: NewFollowup, attempt: FailedAttempt, now: Date): FollowupRecord {
  return {
    ...base,
    reason: attempt.reason,
    attempts: 1,
    lastAttemptAt: attempt.at,
    dueAt: new Date(attempt.at.getTime() + DECISION_WINDOW_MS),
    status: 'open',
    decision: null,
    stopDeskId: null,
    note: null,
    decidedBy: null,
    decidedAt: null,
    outcome: null,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Another failed attempt reopens the item: the last decision did not work. An older scan that
 * arrives late (polling after a webhook) changes nothing.
 */
export function withAnotherAttempt(
  current: FollowupRecord,
  attempt: FailedAttempt,
  now: Date,
): FollowupRecord | null {
  if (attempt.at <= current.lastAttemptAt) return null;
  return {
    ...current,
    reason: attempt.reason,
    attempts: current.attempts + 1,
    lastAttemptAt: attempt.at,
    dueAt: new Date(attempt.at.getTime() + DECISION_WINDOW_MS),
    status: 'open',
    outcome: null,
    updatedAt: now,
  };
}

const OUTCOME_OF: Readonly<Partial<Record<ParcelStatus, FollowupOutcome>>> = {
  delivered: 'delivered',
  returning: 'returned',
  returned: 'returned',
};

/** A delivery or return ends the follow-up; other statuses leave it as it is. */
export function closedBy(
  current: FollowupRecord,
  to: ParcelStatus,
  now: Date,
): FollowupRecord | null {
  const outcome = OUTCOME_OF[to];
  if (!outcome || current.status === 'closed') return null;
  return { ...current, status: 'closed', outcome, updatedAt: now };
}

export interface Decision {
  readonly decision: FollowupDecision;
  readonly stopDeskId?: string | undefined;
  readonly note?: string | undefined;
  readonly by: string;
  readonly at: Date;
}

/** The seller's choice; it may be changed until the parcel ends. */
export function decide(current: FollowupRecord, choice: Decision): FollowupRecord {
  if (current.status === 'closed') throw new FollowupClosedError();
  return {
    ...current,
    status: 'decided',
    decision: choice.decision,
    stopDeskId: choice.decision === 'switch_to_stopdesk' ? (choice.stopDeskId ?? null) : null,
    note: choice.note ?? null,
    decidedBy: choice.by,
    decidedAt: choice.at,
    updatedAt: choice.at,
  };
}
