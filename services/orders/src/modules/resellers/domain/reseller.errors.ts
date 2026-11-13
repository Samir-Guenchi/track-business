import { DomainError } from '@trackecom/service-kit';

export class ResellerNotFoundError extends DomainError {
  readonly code = 'resellers.not_found';
  readonly kind = 'not_found';
}

export class ResellerProductNotFoundError extends DomainError {
  readonly code = 'resellers.product_not_found';
  readonly kind = 'not_found';
}

/** The supplier paused this reseller: the portal still opens, new orders are refused. */
export class ResellerPausedError extends DomainError {
  readonly code = 'resellers.paused';
  readonly kind = 'forbidden';
}

/** Unknown or paused product, or a selling price under the supplier or minimum price. */
export class ResellerPriceError extends DomainError {
  readonly code = 'resellers.invalid_item';
  readonly kind = 'invalid';
}

export class ResellerDeliveryError extends DomainError {
  readonly code = 'resellers.delivery_unavailable';
  readonly kind = 'invalid';
}

export class ResellerDailyLimitError extends DomainError {
  readonly code = 'resellers.daily_limit';
  readonly kind = 'rate_limited';
}
