import { DomainError } from '@trackecom/service-kit';
import type { ExchangeRefusal } from './exchange.js';

const MESSAGES: Readonly<Record<ExchangeRefusal, string>> = {
  not_delivered: 'Only a delivered order can be exchanged',
  unknown_item: 'One of the items is not on this order',
  too_many: 'More items to exchange than the customer received',
  already_exchanged: 'This order already has an exchange',
};

/** Why an exchange cannot be created from this order (#138). */
export class ExchangeRefusedError extends DomainError {
  readonly code: string;
  readonly kind = 'conflict';

  constructor(reason: ExchangeRefusal) {
    super(MESSAGES[reason], { reason });
    this.code = `orders.exchange_${reason}`;
  }
}
