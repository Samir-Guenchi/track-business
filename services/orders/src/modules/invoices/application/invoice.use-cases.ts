import { Inject, Injectable } from '@nestjs/common';
import { type Invoice, type ListInvoicesQuery, missingForInvoice } from '@trackecom/contracts';
import type { OrderActor } from '../../orders/application/order-actor.js';
import { ORDERS_PORTS, type OrderRepository } from '../../orders/application/ports/orders.ports.js';
import { OrderNotFoundError } from '../../orders/domain/order.errors.js';
import { draftOf } from '../domain/invoice-draft.js';
import {
  InvoiceNotFoundError,
  LegalProfileIncompleteError,
  OrderNotDeliveredError,
} from '../domain/invoice.errors.js';
import { INVOICES, type InvoiceRepository } from './ports/invoices.port.js';
import { LEGAL_COPIES, type LegalCopyRepository } from './ports/legal-copy.port.js';

type Store = Pick<OrderActor, 'storeId'>;

/**
 * Invoices for delivered orders and the credit notes that cancel them (#140). Both are issued
 * once: asking again returns the same document, so a double click never burns a number.
 */
@Injectable()
export class InvoiceUseCases {
  constructor(
    @Inject(INVOICES) private readonly invoices: InvoiceRepository,
    @Inject(LEGAL_COPIES) private readonly legal: LegalCopyRepository,
    @Inject(ORDERS_PORTS.repository) private readonly orders: OrderRepository,
  ) {}

  async issue({ storeId }: Store, orderId: string): Promise<Invoice> {
    const order = await this.orders.findById(storeId, orderId);
    if (!order) throw new OrderNotFoundError();
    if (order.status !== 'delivered') throw new OrderNotDeliveredError(order.status);
    const profile = await this.legal.find(storeId);
    const missing = profile ? missingForInvoice(profile) : ['legalName' as const];
    if (!profile || missing.length > 0) throw new LegalProfileIncompleteError(missing);
    const draft = draftOf(order, profile);
    return this.invoices.issue({
      storeId,
      kind: 'invoice',
      draft,
      creditFor: null,
      now: new Date(),
    });
  }

  /** Same content as the invoice it cancels, under its own number sequence. */
  async creditNote(store: Store, invoiceId: string): Promise<Invoice> {
    const invoice = await this.get(store, invoiceId);
    if (invoice.kind !== 'invoice') throw new InvoiceNotFoundError();
    const { id, number, orderId, orderRef, seller, customer, lines, totals } = invoice;
    const draft = { orderId, orderRef, seller, customer, lines, totals };
    return this.invoices.issue({
      storeId: store.storeId,
      kind: 'credit_note',
      draft,
      creditFor: { id, number },
      now: new Date(),
    });
  }

  async get({ storeId }: Store, id: string): Promise<Invoice> {
    const invoice = await this.invoices.findById(storeId, id);
    if (!invoice) throw new InvoiceNotFoundError();
    return invoice;
  }

  list({ storeId }: Store, query: ListInvoicesQuery): Promise<Invoice[]> {
    return this.invoices.list(storeId, query);
  }
}
