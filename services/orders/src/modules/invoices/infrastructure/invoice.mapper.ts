import {
  type Invoice,
  InvoiceCustomerSchema,
  InvoiceKindSchema,
  InvoiceLineSchema,
  InvoiceSellerSchema,
  InvoiceTotalsSchema,
} from '@trackecom/contracts';
import { z } from 'zod';
import type { Prisma } from '../../../generated/prisma/client.js';

export const invoiceInclude = {
  creditFor: { select: { id: true, number: true } },
} satisfies Prisma.InvoiceInclude;

type Row = Prisma.InvoiceGetPayload<{ include: typeof invoiceInclude }>;

/** What `content` holds: the printed parts of the invoice. */
export const InvoiceContentSchema = z.strictObject({
  seller: InvoiceSellerSchema,
  customer: InvoiceCustomerSchema,
  lines: z.array(InvoiceLineSchema),
  totals: InvoiceTotalsSchema,
});

export const toInvoice = (row: Row): Invoice => ({
  id: row.id,
  kind: InvoiceKindSchema.parse(row.kind),
  number: row.number,
  orderId: row.orderId,
  orderRef: row.orderRef,
  issuedAt: row.issuedAt.toISOString(),
  ...InvoiceContentSchema.parse(row.content),
  creditFor: row.creditFor,
});
