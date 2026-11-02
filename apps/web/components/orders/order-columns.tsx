'use client';

import type { Order, Wilaya } from '@trackecom/contracts';
import { type DataColumn, MoneyDZD } from '@trackecom/ui';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { formatDateTime } from '../../lib/format';
import { useWilayas, wilayaLabel } from '../../lib/geo/geo-queries';
import { isLocale, type Locale } from '../../i18n/routing';
import { CustomerCell, RefCell, StatusCell } from './order-cells';

interface ColumnDeps {
  readonly t: ReturnType<typeof useTranslations<'orders'>>;
  readonly locale: Locale;
  readonly wilayas: readonly Wilaya[];
}

function wilayaNameOf(wilayas: readonly Wilaya[], code: number, locale: Locale): string {
  const wilaya = wilayas.find((item) => item.code === code);
  return wilaya ? wilayaLabel(wilaya, locale) : String(code);
}

function buildColumns({ t, locale, wilayas }: ColumnDeps): DataColumn<Order>[] {
  const wilayaName = (code: number) => wilayaNameOf(wilayas, code, locale);
  const statusCell = (order: Order) => (
    <StatusCell order={order} label={t(`status.${order.status}`)} riskLabel={t('risk')} />
  );
  return [
    {
      id: 'ref',
      header: t('columns.ref'),
      cell: (o) => <RefCell order={o} />,
      sortValue: (o) => o.ref,
    },
    {
      id: 'customer',
      header: t('columns.customer'),
      cell: (o) => <CustomerCell order={o} />,
      sortValue: (o) => o.customer.name,
    },
    {
      id: 'wilaya',
      header: t('columns.wilaya'),
      cell: (o) => wilayaName(o.customer.wilayaCode),
      sortValue: (o) => o.customer.wilayaCode,
    },
    {
      id: 'total',
      header: t('columns.total'),
      cell: (o) => <MoneyDZD amount={o.codAmount} locale={locale} />,
      sortValue: (o) => o.codAmount,
    },
    { id: 'status', header: t('columns.status'), cell: statusCell, sortValue: (o) => o.status },
    {
      id: 'created',
      header: t('columns.created'),
      cell: (o) => formatDateTime(new Date(o.createdAt), locale),
      sortValue: (o) => o.createdAt,
    },
  ];
}

/** Columns of the orders table, labelled in the reader's language. */
export function useOrderColumns(): readonly DataColumn<Order>[] {
  const t = useTranslations('orders');
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ? rawLocale : 'fr';
  const wilayas = useWilayas().data?.items;
  return useMemo(() => buildColumns({ t, locale, wilayas: wilayas ?? [] }), [t, locale, wilayas]);
}
