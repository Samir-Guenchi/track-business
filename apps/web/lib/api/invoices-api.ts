import { InvoiceSchema, ListInvoicesResponseSchema } from '@trackecom/contracts';
import { apiRequest } from './api-client';

/** Invoices and credit notes (#140), served by the orders service. */
export const invoicesApi = {
  forOrder: (orderId: string) =>
    apiRequest({
      path: `/invoices?orderId=${encodeURIComponent(orderId)}`,
      schema: ListInvoicesResponseSchema,
    }),
  issue: (orderId: string) =>
    apiRequest({
      path: `/orders/${encodeURIComponent(orderId)}/invoice`,
      schema: InvoiceSchema,
      method: 'POST',
    }),
  creditNote: (invoiceId: string) =>
    apiRequest({
      path: `/invoices/${encodeURIComponent(invoiceId)}/credit-note`,
      schema: InvoiceSchema,
      method: 'POST',
    }),
};
