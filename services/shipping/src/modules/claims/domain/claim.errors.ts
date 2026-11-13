import { DomainError } from '@trackecom/service-kit';
import type { ClaimRefusal } from './claim-rules.js';

export class ClaimNotFoundError extends DomainError {
  readonly code = 'claims.not_found';
  readonly kind = 'not_found';
}

/** A parcel has one claim; the existing one is updated instead. */
export class ClaimExistsError extends DomainError {
  readonly code = 'claims.exists';
  readonly kind = 'conflict';
}

export class ClaimRefusedError extends DomainError {
  readonly code: `claims.${ClaimRefusal}`;
  readonly kind = 'conflict';

  constructor(readonly reason: ClaimRefusal) {
    super(MESSAGES[reason]);
    this.code = `claims.${reason}`;
  }
}

const MESSAGES: Readonly<Record<ClaimRefusal, string>> = {
  not_handed_over: 'The carrier never had this parcel',
  bad_transition: 'A claim moves from open to submitted, then to won or rejected',
  recovered_without_win: 'Only a won claim has a recovered amount',
};
