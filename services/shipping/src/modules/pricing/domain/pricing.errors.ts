import { DomainError } from '@trackecom/service-kit';

/** A price or rate row names a wilaya that is not in the current reference data. */
export class UnknownWilayaError extends DomainError {
  readonly code = 'pricing.unknown_wilaya';
  readonly kind = 'invalid';

  constructor(readonly wilayaCodes: readonly number[]) {
    super(`Unknown wilaya codes: ${wilayaCodes.join(', ')}`);
  }
}
