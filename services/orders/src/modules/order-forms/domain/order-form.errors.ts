import { DomainError } from '@trackecom/service-kit';

/** Unknown key or id, another store's form, or a form switched off. */
export class OrderFormNotFoundError extends DomainError {
  readonly code = 'forms.not_found';
  readonly kind = 'not_found';
}
