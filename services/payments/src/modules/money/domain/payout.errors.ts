import { DomainError } from '@trackecom/service-kit';

export class PayoutAlreadyImportedError extends DomainError {
  readonly code = 'payments.payout_already_imported';
  readonly kind = 'conflict';

  constructor() {
    super('This carrier statement was already imported');
  }
}

export class DuplicatePayoutLineError extends DomainError {
  readonly code = 'payments.duplicate_line';
  readonly kind = 'invalid';

  constructor(trackingNumbers: readonly string[]) {
    super('A tracking number appears more than once on the statement', {
      trackingNumbers: trackingNumbers.slice(0, 20),
    });
  }
}

export class PayoutNotFoundError extends DomainError {
  readonly code = 'payments.payout_not_found';
  readonly kind = 'not_found';

  constructor() {
    super('Payout not found');
  }
}

/** A parcel changed between our read and our write; the work is retried from a fresh read. */
export class ParcelChangedError extends Error {
  constructor() {
    super('A parcel changed while it was being reconciled');
  }
}
