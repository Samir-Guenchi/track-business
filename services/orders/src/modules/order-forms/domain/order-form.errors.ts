import { DomainError, type DomainErrorKind } from '@trackecom/service-kit';

/** Unknown key or id, another store's form, or a form switched off. */
export class OrderFormNotFoundError extends DomainError {
  readonly code = 'forms.not_found';
  readonly kind = 'not_found';
}

/** Unknown product, a variant not offered, or a quantity above the form's limit. */
export class FormProductError extends DomainError {
  readonly code = 'forms.invalid_product';
  readonly kind = 'invalid';
}

/** The store has no price for this wilaya and delivery type, or the form does not offer it. */
export class DeliveryUnavailableError extends DomainError {
  readonly code = 'forms.delivery_unavailable';
  readonly kind = 'invalid';
}

/** Refused by the anti-spam screen; the code says why so the page can explain it. */
export class SubmissionRefusedError extends DomainError {
  readonly kind: DomainErrorKind;
  readonly code: string;

  constructor(reason: 'duplicate' | 'rate_limited' | 'spam') {
    super(REFUSAL_MESSAGES[reason]);
    this.code = `forms.${reason}`;
    this.kind = REFUSAL_KINDS[reason];
  }
}

const REFUSAL_MESSAGES = {
  duplicate: 'You already ordered this product; the shop will call you',
  rate_limited: 'Too many orders, try again later',
  spam: 'Order refused',
} as const;

const REFUSAL_KINDS = {
  duplicate: 'conflict',
  rate_limited: 'rate_limited',
  spam: 'invalid',
} as const;
