import {
  type InvoiceKind,
  type InvoiceLine,
  type InvoiceSeller,
  type InvoiceTotals,
  STANDARD_VAT_RATE,
  type StoreLegalProfile,
} from '@trackecom/contracts';
import type { OrderRecord } from '../../orders/domain/order.js';

/** Everything printed on an invoice except what issuing adds (id, number, date). */
export interface InvoiceDraft {
  readonly orderId: string;
  readonly orderRef: string;
  readonly seller: InvoiceSeller;
  readonly customer: {
    readonly name: string;
    readonly phone: string;
    readonly address: string | null;
    readonly wilayaCode: number;
    readonly communeId: number;
  };
  readonly lines: readonly InvoiceLine[];
  readonly totals: InvoiceTotals;
}

/** Prices are tax included: under the real regime the VAT is taken out of the total. */
export function totalsOf(order: OrderRecord, taxRegime: InvoiceSeller['taxRegime']): InvoiceTotals {
  const total = order.subtotal + order.shippingFee - order.discount;
  const vatRate = taxRegime === 'real' ? STANDARD_VAT_RATE : 0;
  const totalBeforeTax = Math.round((total * 100) / (100 + vatRate));
  return {
    shippingFee: order.shippingFee,
    discount: order.discount,
    total,
    vatRate,
    vatAmount: total - totalBeforeTax,
    totalBeforeTax,
  };
}

export function draftOf(order: OrderRecord, legal: StoreLegalProfile): InvoiceDraft {
  const seller = sellerOf(legal);
  const { customer } = order;
  return {
    orderId: order.id,
    orderRef: order.ref,
    seller,
    customer: {
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      wilayaCode: customer.wilayaCode,
      communeId: customer.communeId,
    },
    lines: order.items.map((item) => ({
      description: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.lineTotal,
    })),
    totals: totalsOf(order, seller.taxRegime),
  };
}

/** The legal profile without its edit date: what the invoice keeps. */
const sellerOf = (legal: StoreLegalProfile): InvoiceSeller => ({
  regime: legal.regime,
  taxRegime: legal.taxRegime,
  legalName: legal.legalName,
  address: legal.address,
  nif: legal.nif,
  nis: legal.nis,
  rcNumber: legal.rcNumber,
  autoEntrepreneurCard: legal.autoEntrepreneurCard,
  articleImposition: legal.articleImposition,
});

const PREFIX: Readonly<Record<InvoiceKind, string>> = { invoice: 'F', credit_note: 'AV' };

/** `F-2026-000042`: one sequence per store, kind and year. */
export const invoiceNumber = (kind: InvoiceKind, year: number, sequence: number): string =>
  `${PREFIX[kind]}-${year}-${String(sequence).padStart(6, '0')}`;

const YEAR = new Intl.DateTimeFormat('en', { timeZone: 'Africa/Algiers', year: 'numeric' });

/** Numbering restarts every calendar year, in Algerian time. */
export const algiersYear = (date: Date): number => Number(YEAR.format(date));
