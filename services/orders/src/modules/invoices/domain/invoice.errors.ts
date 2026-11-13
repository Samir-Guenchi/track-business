import type { LegalField, OrderStatus } from '@trackecom/contracts';
import { DomainError } from '@trackecom/service-kit';

export class OrderNotDeliveredError extends DomainError {
  readonly code = 'invoices.order_not_delivered';
  readonly kind = 'conflict';

  constructor(status: OrderStatus) {
    super('Only a delivered order can be invoiced', { status });
  }
}

export class LegalProfileIncompleteError extends DomainError {
  readonly code = 'invoices.legal_profile_incomplete';
  readonly kind = 'conflict';

  constructor(missing: readonly LegalField[]) {
    super('The store legal profile is missing fields an invoice needs', { missing });
  }
}

export class InvoiceNotFoundError extends DomainError {
  readonly code = 'invoices.not_found';
  readonly kind = 'not_found';

  constructor() {
    super('Invoice not found');
  }
}
