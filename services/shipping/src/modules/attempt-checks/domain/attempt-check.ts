import {
  CHECKABLE_ATTEMPT_REASONS,
  type FailedAttemptReason,
  FailedAttemptReasonSchema,
} from '@trackecom/contracts';
import { DomainError } from '@trackecom/service-kit';

/** After a week the customer no longer remembers the day; the question stops being asked. */
export const CHECK_WINDOW_MS = 7 * 86_400_000;

/** The parcel's latest status-bearing tracking event. */
export interface LatestEvent {
  readonly id: string;
  readonly status: string | null;
  readonly failureReason: string | null;
  readonly at: Date;
}

export interface CheckableAttempt {
  readonly eventId: string;
  readonly at: Date;
  readonly reason: FailedAttemptReason;
}

const isCheckable = (reason: string | null): reason is FailedAttemptReason =>
  (CHECKABLE_ATTEMPT_REASONS as readonly string[]).includes(reason ?? '') &&
  FailedAttemptReasonSchema.safeParse(reason).success;

/**
 * The attempt to ask the customer about: only while the parcel's last word is a failed attempt
 * that claims the courier reached them (absent, no answer, phone off, refused), for a week.
 */
export function checkableAttempt(event: LatestEvent | null, now: Date): CheckableAttempt | null {
  if (event?.status !== 'failed_attempt' || !isCheckable(event.failureReason)) return null;
  if (now.getTime() - event.at.getTime() > CHECK_WINDOW_MS) return null;
  return { eventId: event.id, at: event.at, reason: event.failureReason };
}

/** The answer is about another attempt than the one open now, or none is open. */
export class AttemptNotCheckableError extends DomainError {
  readonly code = 'attempt_checks.not_checkable';
  readonly kind = 'conflict';
}

export class AttemptAlreadyAnsweredError extends DomainError {
  readonly code = 'attempt_checks.already_answered';
  readonly kind = 'conflict';
}
