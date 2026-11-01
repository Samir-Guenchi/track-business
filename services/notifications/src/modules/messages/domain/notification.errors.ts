import { DomainError } from '@trackecom/service-kit';

/** Reset asked for a template the store never changed. */
export class TemplateNotCustomError extends DomainError {
  readonly code = 'notifications.template_not_custom';
  readonly kind = 'not_found';

  constructor() {
    super('This template already uses the built-in text');
  }
}

export class OptOutNotFoundError extends DomainError {
  readonly code = 'notifications.opt_out_not_found';
  readonly kind = 'not_found';

  constructor() {
    super('This phone is not on the opt-out list');
  }
}
