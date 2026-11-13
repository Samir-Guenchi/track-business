'use client';

import type { Invoice, InvoiceTotals } from '@trackecom/contracts';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '../../i18n/routing';
import { formatDate, formatDzd } from '../../lib/format';
import { type InvoiceText, presentLines } from '../../lib/invoices/invoice-html';

type T = ReturnType<typeof useTranslations<'invoices'>>;
type Row = readonly [string, string];

const sellerLines = (t: T, seller: Invoice['seller']) =>
  presentLines([
    ['', seller.legalName],
    ['', seller.address],
    [t('print.nif'), seller.nif],
    [t('print.nis'), seller.nis],
    [t('print.rc'), seller.rcNumber],
    [t('print.card'), seller.autoEntrepreneurCard],
    [t('print.article'), seller.articleImposition],
  ]);

function totalRows(t: T, money: (amount: number) => string, totals: InvoiceTotals): Row[] {
  const rows: Row[] = [[t('print.shipping'), money(totals.shippingFee)]];
  if (totals.discount > 0) rows.push([t('print.discount'), `-${money(totals.discount)}`]);
  if (totals.vatRate > 0) {
    rows.push([t('print.beforeTax'), money(totals.totalBeforeTax)]);
    rows.push([t('print.vat', { rate: totals.vatRate }), money(totals.vatAmount)]);
  }
  rows.push([t('print.totalDue'), money(totals.total)]);
  return rows;
}

/** Translates and formats an invoice into the words printed on the page. */
export function useInvoiceText(): (invoice: Invoice) => InvoiceText {
  const t = useTranslations('invoices');
  const locale = useLocale() as Locale;
  const money = (amount: number) => formatDzd(amount, locale);
  return (invoice) => ({
    title: `${t(`kind.${invoice.kind}`)} ${invoice.number}`,
    dir: locale === 'ar' ? 'rtl' : 'ltr',
    meta: [
      `${t('print.date')} ${formatDate(new Date(invoice.issuedAt), locale)}`,
      `${t('print.order')} ${invoice.orderRef}`,
      ...(invoice.creditFor ? [`${t('print.cancels')} ${invoice.creditFor.number}`] : []),
    ],
    seller: sellerLines(t, invoice.seller),
    customer: presentLines([
      [t('print.customer'), invoice.customer.name],
      ['', invoice.customer.phone],
      ['', invoice.customer.address],
    ]),
    headers: [t('print.item'), t('print.quantity'), t('print.unitPrice'), t('print.total')],
    lines: invoice.lines.map((line) => [
      line.description,
      String(line.quantity),
      money(line.unitPrice),
      money(line.total),
    ]),
    totals: totalRows(t, money, invoice.totals),
    footer:
      invoice.totals.vatRate > 0 ? t('print.paidCod') : `${t('print.noVat')} ${t('print.paidCod')}`,
  });
}
