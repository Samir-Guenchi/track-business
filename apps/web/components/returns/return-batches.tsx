'use client';

import type { ReturnBatchSummary } from '@trackecom/contracts';
import { EmptyState, Skeleton } from '@trackecom/ui';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';
import type { Locale } from '../../i18n/routing';
import { formatDateTime } from '../../lib/format';
import { useReturnBatches } from '../../lib/returns/returns-queries';
import { MoreButton } from './more-button';

const COLUMNS = ['date', 'carrier', 'courier', 'received', 'missing'] as const;

/** Past hand-overs, newest first, each opening its manifest. */
export function ReturnBatches() {
  const t = useTranslations('returns');
  const list = useReturnBatches();
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  if (list.isPending) return <Skeleton className="h-40" />;
  if (items.length === 0)
    return <EmptyState title={t('tabs.batches')} description={t('emptyBatches')} />;
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-panel border border-border bg-surface p-3 shadow-panel">
        <table className="w-full text-sm">
          <thead className="text-muted">
            <tr>
              {COLUMNS.map((column) => (
                <th key={column} className="px-2 py-1 text-start font-medium">
                  {t(`batches.${column}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((batch) => (
              <BatchRow key={batch.id} batch={batch} />
            ))}
          </tbody>
        </table>
      </div>
      <MoreButton list={list} label={t('more')} />
    </div>
  );
}

function BatchRow({ batch }: { readonly batch: ReturnBatchSummary }) {
  const locale = useLocale() as Locale;
  return (
    <tr className="border-t border-border">
      <td className="px-2 py-2">
        <Link href={`/returns/batches/${batch.id}`} className="text-tape underline">
          {formatDateTime(new Date(batch.createdAt), locale)}
        </Link>
      </td>
      <td className="px-2 py-2" dir="ltr">
        {batch.carrier}
      </td>
      <td className="px-2 py-2">{batch.courierName ?? '-'}</td>
      <td className="px-2 py-2">{batch.receivedCount}</td>
      <td className={batch.missing.length > 0 ? 'px-2 py-2 font-medium text-stamp' : 'px-2 py-2'}>
        {batch.missing.length}
      </td>
    </tr>
  );
}
