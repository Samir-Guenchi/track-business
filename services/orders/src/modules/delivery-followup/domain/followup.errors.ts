import { DomainError } from '@trackecom/service-kit';

export class FollowupNotFoundError extends DomainError {
  readonly code = 'followups.not_found';
  readonly kind = 'not_found';

  constructor() {
    super('Follow-up not found');
  }
}

/** The parcel was delivered or returned: there is nothing left to decide. */
export class FollowupClosedError extends DomainError {
  readonly code = 'followups.closed';
  readonly kind = 'conflict';

  constructor() {
    super('This parcel was already delivered or returned');
  }
}
