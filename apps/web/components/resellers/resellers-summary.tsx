'use client';

import { useTranslations } from 'next-intl';
import type { ResellerSummary } from '../../lib/resellers/reseller-summary';

const rateOf = (summary: ResellerSummary): number | null =>
  summary.deliveryRate === null ? null : Math.round(summary.deliveryRate * 100);

function DeliveryRateStat({
  rate,
  finalOrders,
}: {
  readonly rate: number | null;
  readonly finalOrders: number;
}) {
  const t = useTranslations('resellers.summary');
  return (
    <div className="studio-stat" data-status={rate === null ? undefined : 'attention'}>
      <dt>{t('rate')}</dt>
      <dd>{rate === null ? '—' : `${rate} %`}</dd>
      <div className="studio-stat__foot">
        <span>{rate === null ? t('noRate') : t('finalOrders', { count: finalOrders })}</span>
      </div>
      {rate !== null && (
        <span className="studio-stat__bar" aria-hidden="true">
          <span style={{ width: `${rate}%` }} />
        </span>
      )}
    </div>
  );
}

/** Four store-wide numbers above the reseller directory. */
export function ResellersSummary({ summary }: { readonly summary: ResellerSummary }) {
  const t = useTranslations('resellers.summary');
  const resellers = useTranslations('resellers');
  const rate = rateOf(summary);
  return (
    <dl className="studio-stats">
      <div className="studio-stat">
        <dt>{t('resellers')}</dt>
        <dd>{summary.count}</dd>
        <div className="studio-stat__foot">
          <span>{t('active', { count: summary.active })}</span>
        </div>
      </div>
      <div className="studio-stat">
        <dt>{t('orders')}</dt>
        <dd>{summary.orders}</dd>
        <div className="studio-stat__foot">
          <span>{t('delivered', { count: summary.delivered })}</span>
        </div>
      </div>
      <DeliveryRateStat rate={rate} finalOrders={summary.finalOrders} />
      <div className="studio-stat" data-status={summary.marginEarned > 0 ? 'attention' : undefined}>
        <dt>{t('earned')}</dt>
        <dd>{resellers('dinars', { amount: summary.marginEarned })}</dd>
        <div className="studio-stat__foot">
          <span>{t('pendingNote', { amount: summary.marginPending })}</span>
        </div>
      </div>
    </dl>
  );
}
