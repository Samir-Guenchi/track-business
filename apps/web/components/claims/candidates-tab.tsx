'use client';

import type { ClaimCandidate } from '@trackecom/contracts';
import { Badge, EmptyState, Skeleton } from '@trackecom/ui';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';
import type { Locale } from '../../i18n/routing';
import { useClaimCandidates } from '../../lib/claims/claims-queries';
import { formatDate } from '../../lib/format';
import { FormAlert } from '../auth/form-alert';
import { useErrorMessage } from '../auth/use-error-message';
import { cell, ClaimsTable } from './claims-table';
import { OpenClaimDialog } from './open-claim-dialog';

/** Parcels that look claimable and have no claim yet, the longest-waiting first. */
export function CandidatesTab() {
  const t = useTranslations('claims');
  const candidates = useClaimCandidates();
  const errorMessage = useErrorMessage();
  const items = candidates.data?.items ?? [];
  if (candidates.isPending) return <Skeleton className="mt-3 h-40" />;
  if (candidates.isError) return <FormAlert message={errorMessage(candidates.error)} />;
  if (items.length === 0)
    return (
      <EmptyState
        title={t('candidatesEmpty.title')}
        description={t('candidatesEmpty.description')}
      />
    );
  const headers = ['tracking', 'carrier', 'reason', 'since'].map((key) => t(`columns.${key}`));
  return (
    <ClaimsTable label={t('tabs.candidates')} headers={[...headers, '']}>
      {items.map((item) => (
        <CandidateRow key={item.shipmentId} item={item} />
      ))}
    </ClaimsTable>
  );
}

function CandidateRow({ item }: { readonly item: ClaimCandidate }) {
  const t = useTranslations('claims');
  const locale = useLocale() as Locale;
  return (
    <tr className="border-t border-border">
      <td className={cell} dir="ltr">
        <Link href={`/orders/${item.orderId}`} className="font-medium text-tape underline">
          {item.trackingNumber}
        </Link>
      </td>
      <td className={cell} dir="ltr">
        {item.carrier}
      </td>
      <td className={cell}>
        <Badge variant={item.reason === 'stuck' ? 'warning' : 'danger'}>
          {t(`reason.${item.reason}`)}
        </Badge>
      </td>
      <td className={cell}>{formatDate(new Date(item.since), locale)}</td>
      <td className={`${cell} text-end`}>
        <OpenClaimDialog candidate={item} />
      </td>
    </tr>
  );
}
