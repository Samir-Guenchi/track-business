'use client';

import type { AttemptChecksReport } from '@trackecom/contracts';
import { EmptyState, Skeleton } from '@trackecom/ui';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '../../i18n/routing';
import { Link } from '../../i18n/navigation';
import { attemptChecksApi } from '../../lib/api/attempt-checks-api';
import { disputeRate } from '../../lib/claims/dispute-rate';
import { formatDateTime } from '../../lib/format';
import { FormAlert } from '../auth/form-alert';
import { useErrorMessage } from '../auth/use-error-message';

const DAYS = 30;

function CarrierRates({ carriers }: { readonly carriers: AttemptChecksReport['carriers'] }) {
  const t = useTranslations('attemptCheck.seller');
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {carriers.map((row) => (
        <li key={row.carrier} className="flex justify-between gap-4 border-b border-border py-1">
          <span className="font-medium">{row.carrier}</span>
          <span>
            {t('rate', {
              disputed: row.disputed,
              answered: row.answered,
              rate: disputeRate(row) ?? 0,
            })}
          </span>
        </li>
      ))}
    </ul>
  );
}

function DisputedList({ items }: { readonly items: AttemptChecksReport['disputed'] }) {
  const t = useTranslations('attemptCheck');
  const locale = useLocale() as Locale;
  return (
    <ul className="flex flex-col gap-2 text-sm">
      {items.map((item) => (
        <li
          key={`${item.shipmentId}-${item.attemptAt}`}
          className="rounded-control border border-border p-3"
        >
          <Link href={`/orders/${item.orderId}`} className="font-medium underline" dir="ltr">
            {item.trackingNumber}
          </Link>
          <span className="text-muted">
            {' '}
            · {item.carrier} · {formatDateTime(new Date(item.attemptAt), locale)}
          </span>
          <p>{t('seller.claimed', { reason: t(`seller.reason.${item.reason}`) })}</p>
        </li>
      ))}
    </ul>
  );
}

/** Failed attempts the customer says never happened (#195): evidence for the carrier. */
export function DisputedAttemptsTab() {
  const t = useTranslations('attemptCheck.seller');
  const report = useQuery({
    queryKey: ['attempt-checks', DAYS],
    queryFn: () => attemptChecksApi.report(DAYS),
  });
  const errorMessage = useErrorMessage();
  return (
    <div className="mt-3 flex flex-col gap-4">
      <p className="text-sm text-muted">{t('description', { days: DAYS })}</p>
      {report.isPending && <Skeleton className="h-40" />}
      <FormAlert message={report.isError ? errorMessage(report.error) : null} />
      {report.data?.carriers.length === 0 && (
        <EmptyState title={t('empty.title')} description={t('empty.description')} />
      )}
      {report.data && report.data.carriers.length > 0 && (
        <>
          <CarrierRates carriers={report.data.carriers} />
          <DisputedList items={report.data.disputed} />
        </>
      )}
    </div>
  );
}
