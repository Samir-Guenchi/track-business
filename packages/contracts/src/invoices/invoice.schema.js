import { z } from 'zod';
import { StoreLegalProfileSchema } from '../stores/store-legal.schema.js';
/** An invoice for a delivered order, or the credit note that cancels it (#140). */
export const InvoiceKindSchema = z.enum(['invoice', 'credit_note']);
/** VAT rate shown by sellers under the real tax regime; prices are entered tax included. */
export const STANDARD_VAT_RATE = 19;
const Money = z.number().int().nonnegative();
export const InvoiceLineSchema = z.strictObject({
  description: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: Money,
  total: Money,
});
/** The legal profile as it was when the invoice was issued; later edits do not change it. */
export const InvoiceSellerSchema = StoreLegalProfileSchema.omit({ updatedAt: true });
export const InvoiceCustomerSchema = z.strictObject({
  name: z.string(),
  phone: z.string(),
  address: z.string().nullable(),
  wilayaCode: z.number().int(),
  communeId: z.number().int(),
});
export const InvoiceTotalsSchema = z.strictObject({
  shippingFee: Money,
  discount: Money,
  /** Tax included, as the customer paid it. */
  total: Money,
  /** 0 under the IFU regime. */
  vatRate: z.number().int().nonnegative(),
  vatAmount: Money,
  totalBeforeTax: Money,
});
export const InvoiceSchema = z.strictObject({
  id: z.uuid(),
  kind: InvoiceKindSchema,
  /** `F-2026-000001` for invoices, `AV-2026-000001` for credit notes: no gaps per store. */
  number: z.string(),
  orderId: z.uuid(),
  orderRef: z.string(),
  issuedAt: z.iso.datetime(),
  seller: InvoiceSellerSchema,
  customer: InvoiceCustomerSchema,
  lines: z.array(InvoiceLineSchema),
  totals: InvoiceTotalsSchema,
  /** On a credit note: the invoice it cancels. */
  creditFor: z.strictObject({ id: z.uuid(), number: z.string() }).nullable(),
});
export const ListInvoicesQuerySchema = z.strictObject({ orderId: z.uuid().optional() });
export const ListInvoicesResponseSchema = z.strictObject({ items: z.array(InvoiceSchema) });
