import { DomainError } from '@trackecom/service-kit';

/** No batch with this id in the caller's store. */
export class ReturnBatchNotFoundError extends DomainError {
  readonly code = 'returns.batch_not_found';
  readonly kind = 'not_found';
}

/** Another scan received one of these parcels at the same moment; scanning again sorts it out. */
export class ReturnScanConflictError extends DomainError {
  readonly code = 'returns.scan_conflict';
  readonly kind = 'conflict';
}
