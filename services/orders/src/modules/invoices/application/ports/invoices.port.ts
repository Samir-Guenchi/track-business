import type { Invoice, InvoiceKind } from '@trackecom/contracts';
import type { InvoiceDraft } from '../../domain/invoice-draft.js';

export const INVOICES = Symbol('InvoiceRepository');

export interface IssueRequest {
  readonly storeId: string;
  readonly kind: InvoiceKind;
  readonly draft: InvoiceDraft;
  readonly creditFor: { readonly id: string; readonly number: string } | null;
  readonly now: Date;
}

/** Issued invoices and credit notes; numbers are taken in the same transaction as the write. */
export interface InvoiceRepository {
  /** Issues once per (store, kind, order): a second call returns the first invoice. */
  issue(request: IssueRequest): Promise<Invoice>;
  findById(storeId: string, id: string): Promise<Invoice | null>;
  list(storeId: string, filter: { readonly orderId?: string | undefined }): Promise<Invoice[]>;
}
