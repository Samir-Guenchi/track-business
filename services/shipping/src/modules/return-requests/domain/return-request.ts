import {
  type DecideReturnRequest,
  RETURN_REQUEST_WINDOW_DAYS,
  type ReturnRequestState,
} from '@trackecom/contracts';
import { DomainError } from '@trackecom/service-kit';

const DAY_MS = 86_400_000;

/** The parcel's latest status-bearing tracking event. */
export interface LastStatus {
  readonly status: string | null;
  readonly at: Date;
}

/** Last moment a request is taken: the window counts from delivery. Null until delivered. */
export function returnDeadline(last: LastStatus | null): Date | null {
  if (last?.status !== 'delivered') return null;
  return new Date(last.at.getTime() + RETURN_REQUEST_WINDOW_DAYS * DAY_MS);
}

export function insideWindow(last: LastStatus | null, now: Date): boolean {
  const deadline = returnDeadline(last);
  return deadline !== null && now.getTime() <= deadline.getTime();
}

const STATE_OF: Readonly<Record<DecideReturnRequest['decision'], ReturnRequestState>> = {
  accept_exchange: 'accepted_exchange',
  accept_return: 'accepted_return',
  refuse: 'refused',
};

export const stateAfter = (decision: DecideReturnRequest): ReturnRequestState =>
  STATE_OF[decision.decision];

export class ReturnWindowClosedError extends DomainError {
  readonly code = 'return_requests.window_closed';
  readonly kind = 'conflict';
}

export class ReturnRequestExistsError extends DomainError {
  readonly code = 'return_requests.already_requested';
  readonly kind = 'conflict';
}

export class ReturnRequestNotFoundError extends DomainError {
  readonly code = 'return_requests.not_found';
  readonly kind = 'not_found';
}

export class ReturnRequestDecidedError extends DomainError {
  readonly code = 'return_requests.already_decided';
  readonly kind = 'conflict';
}
