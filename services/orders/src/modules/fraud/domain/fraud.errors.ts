import { DomainError } from '@trackecom/service-kit';

export class BlacklistEntryNotFoundError extends DomainError {
  readonly code = 'blacklist.not_found';
  readonly kind = 'not_found';

  constructor() {
    super('Blacklist entry not found');
  }
}
