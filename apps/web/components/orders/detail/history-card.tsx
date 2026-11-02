'use client';

import { Skeleton, StatusBadge } from '@trackecom/ui';
import { useLocale, useTranslations } from 'next-intl';
import { formatDateTime } from '../../../lib/format';
import { useOrderHistory } from '../../../lib/orders/order-queries';
import { isLocale } from '../../../i18n/routing';
import { DetailCard } from './detail-card';

// TODO(#35): merge carrier tracking events into this timeline.
export function HistoryCard({ orderId }: { readonly orderId: string }) {
  const t = useTranslations('orders');
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ? rawLocale : 'fr';
  const history = useOrderHistory(orderId);
  return (
    <DetailCard title={t('detail.history')}>
      {history.isPending && <Skeleton className="h-24" />}
      <ol className="flex flex-col gap-3 border-s border-border ps-4">
        {history.data?.items.map((entry) => (
          <li key={entry.id} className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-muted">{formatDateTime(new Date(entry.at), locale)}</span>
            <span className="flex flex-wrap items-center gap-2">
              {t(`history.${entry.kind}`)}
              {entry.toStatus && (
                <StatusBadge status={entry.toStatus}>{t(`status.${entry.toStatus}`)}</StatusBadge>
              )}
            </span>
            {entry.note && <span className="text-muted">{entry.note}</span>}
          </li>
        ))}
      </ol>
    </DetailCard>
  );
}
