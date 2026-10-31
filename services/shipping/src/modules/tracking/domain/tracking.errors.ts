import { DomainError } from '@trackecom/service-kit';

export class TrackingNotFoundError extends DomainError {
  readonly code = 'tracking.not_found';
  readonly kind = 'not_found';
}

/** Another update of the same shipment committed first; the ingest is retried. */
export class TrackingConflictError extends DomainError {
  readonly code = 'tracking.conflict';
  readonly kind = 'conflict';
}
