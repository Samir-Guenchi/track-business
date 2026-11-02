'use client';

import { Button } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { useBulkStatus } from '../../lib/orders/order-queries';

interface BulkBarProps {
  readonly selectedIds: readonly string[];
  readonly onDone: (message: string) => void;
}

/** Shown when rows are selected; each order succeeds or fails alone on the server. */
export function BulkBar({ selectedIds, onDone }: BulkBarProps) {
  const t = useTranslations('orders');
  const bulk = useBulkStatus();
  if (selectedIds.length === 0) return null;
  const run = (status: 'confirmed' | 'cancelled') =>
    bulk.mutate(
      { orderIds: [...selectedIds], status },
      {
        onSuccess: (result) =>
          onDone(t('bulkDone', { ok: result.succeeded.length, failed: result.failed.length })),
      },
    );
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-panel border border-border bg-surface px-4 py-2">
      <span className="text-sm font-medium">{t('selected', { count: selectedIds.length })}</span>
      <Button size="sm" onClick={() => run('confirmed')} loading={bulk.isPending}>
        {t('actions.confirm')}
      </Button>
      <Button size="sm" variant="danger" onClick={() => run('cancelled')} disabled={bulk.isPending}>
        {t('actions.cancel')}
      </Button>
    </div>
  );
}
