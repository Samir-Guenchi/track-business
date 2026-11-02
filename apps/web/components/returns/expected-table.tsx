'use client';

import type { ExpectedReturn } from '@trackecom/contracts';
import { Badge } from '@trackecom/ui';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';
import type { Locale } from '../../i18n/routing';
import { formatDate } from '../../lib/format';
import { useWilayas, wilayaLabel } from '../../lib/geo/geo-queries';

const COLUMNS = ['tracking', 'carrier', 'wilaya', 'status', 'since', 'waiting'] as const;

export function ExpectedTable({ items }: { readonly items: readonly ExpectedReturn[] }) {
  const t = useTranslations('returns');
  return (
    <div className="overflow-x-auto rounded-panel border border-border bg-surface p-3 shadow-panel">
      <table className="w-full text-sm" aria-label={t('listLabel')}>
        <thead className="text-muted">
          <tr>
            {COLUMNS.map((column) => (
              <th key={column} className="px-2 py-1 text-start font-medium">
                {t(`columns.${column}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <ExpectedRow key={item.shipmentId} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExpectedRow({ item }: { readonly item: ExpectedReturn }) {
  const t = useTranslations('returns');
  const locale = useLocale() as Locale;
  const wilaya = useWilayas().data?.items.find((entry) => entry.code === item.wilayaCode);
  return (
    <tr className="border-t border-border">
      <td className="px-2 py-2" dir="ltr">
        <Link href={`/orders/${item.orderId}`} className="font-medium text-tape underline">
          {item.trackingNumber}
        </Link>
      </td>
      <td className="px-2 py-2" dir="ltr">
        {item.carrier}
      </td>
      <td className="px-2 py-2">
        {wilaya ? wilayaLabel(wilaya, locale) : (item.wilayaCode ?? '-')}
      </td>
      <td className="px-2 py-2">
        {t(`status.${item.status === 'returned' ? 'returned' : 'returning'}`)}
      </td>
      <td className="px-2 py-2">{formatDate(new Date(item.returnSince), locale)}</td>
      <td className="px-2 py-2">
        <span className="me-2">{t('days', { count: item.daysWaiting })}</span>
        {item.overdue && <Badge variant="danger">{t('overdueBadge')}</Badge>}
      </td>
    </tr>
  );
}
