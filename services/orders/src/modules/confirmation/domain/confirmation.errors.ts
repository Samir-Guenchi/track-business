import { DomainError } from '@trackecom/service-kit';

/** The agent logs a call on an order they do not hold (lock expired or taken by someone else). */
export class NotLockedError extends DomainError {
  readonly code = 'confirmation.not_locked';
  readonly kind = 'conflict';

  constructor() {
    super('Take the order from the queue before logging a call');
  }
}

/** The outcome is not possible from the order's current status (e.g. already shipped). */
export class OutcomeNotAllowedError extends DomainError {
  readonly code = 'confirmation.outcome_not_allowed';
  readonly kind = 'conflict';

  constructor(status: string, outcome: string) {
    super(`Cannot log "${outcome}" on an order in status "${status}"`);
  }
}
