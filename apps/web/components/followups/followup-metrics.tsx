'use client';

import type { FollowupMetric } from '@trackecom/contracts';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '../../i18n/routing';
import { formatNumber } from '../../lib/format';
import { useFollowupMetrics } from '../../lib/followups/followup-queries';
import { DetailCard } from '../orders/detail/detail-card';

const COLUMNS = ['carrier', 'reason', 'failed', 'recovered', 'returned', 'rate'] as const;

/** Which carriers and reasons recover parcels, and which end as returns. */
export function FollowupMetrics() {
  const t = useTranslations('followups');
  const rows = useFollowupMetrics().data?.items ?? [];
  return (
    <DetailCard title={t('metrics')}>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{t('metricsEmpty')}</p>
      ) : (
        <MetricsTable rows={rows} />
      )}
    </DetailCard>
  );
}

function MetricsTable({ rows }: { readonly rows: readonly FollowupMetric[] }) {
  const t = useTranslations('followups');
  const locale = useLocale() as Locale;
  const count = (value: number) => formatNumber(value, locale);
  const percent = (rate: number | null) => (rate === null ? '-' : `${Math.round(rate * 100)} %`);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-muted">
          <tr>
            {COLUMNS.map((column) => (
              <th key={column} className="py-1 text-start font-medium">
                {t(`columns.${column}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.carrier}-${row.reason}`} className="border-t border-border">
              <td className="py-1" dir="ltr">
                {row.carrier}
              </td>
              <td className="py-1">{t(`reason.${row.reason}`)}</td>
              <td className="py-1">{count(row.failed)}</td>
              <td className="py-1">{count(row.recovered)}</td>
              <td className="py-1">{count(row.returned)}</td>
              <td className="py-1 font-medium">{percent(row.recoveryRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
