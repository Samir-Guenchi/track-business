'use client';

import type { Claim, ClaimState } from '@trackecom/contracts';
import { Badge, type BadgeVariant, EmptyState, Skeleton } from '@trackecom/ui';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';
import type { Locale } from '../../i18n/routing';
import { useClaims } from '../../lib/claims/claims-queries';
import { formatDate, formatDzd } from '../../lib/format';
import { FormAlert } from '../auth/form-alert';
import { useErrorMessage } from '../auth/use-error-message';
import { ClaimActions } from './claim-actions';
import { cell, ClaimsTable } from './claims-table';

const STATE_BADGE: Readonly<Record<ClaimState, BadgeVariant>> = {
  open: 'warning',
  submitted: 'info',
  won: 'success',
  rejected: 'danger',
};

/** Every claim, newest first, with the next step for each. */
export function ClaimsTab() {
  const t = useTranslations('claims');
  const claims = useClaims();
  const errorMessage = useErrorMessage();
  const items = claims.data?.items ?? [];
  if (claims.isPending) return <Skeleton className="mt-3 h-40" />;
  if (claims.isError) return <FormAlert message={errorMessage(claims.error)} />;
  if (items.length === 0)
    return <EmptyState title={t('claimsEmpty.title')} description={t('claimsEmpty.description')} />;
  const headers = ['tracking', 'carrier', 'reason', 'value', 'state', 'since'];
  return (
    <ClaimsTable
      label={t('tabs.claims')}
      headers={[...headers.map((key) => t(`columns.${key}`)), '']}
    >
      {items.map((claim) => (
        <ClaimRow key={claim.id} claim={claim} />
      ))}
    </ClaimsTable>
  );
}

function ClaimRow({ claim }: { readonly claim: Claim }) {
  const t = useTranslations('claims');
  const locale = useLocale() as Locale;
  return (
    <tr className="border-t border-border align-top">
      <td className={cell} dir="ltr">
        <Link href={`/orders/${claim.orderId}`} className="font-medium text-tape underline">
          {claim.trackingNumber}
        </Link>
      </td>
      <td className={cell} dir="ltr">
        {claim.carrier}
      </td>
      <td className={cell}>{t(`reason.${claim.reason}`)}</td>
      <td className={cell}>
        {formatDzd(claim.declaredValue, locale)}
        {claim.recovered !== null && (
          <p className="text-xs text-muted">
            {t('recovered', { amount: formatDzd(claim.recovered, locale) })}
          </p>
        )}
      </td>
      <td className={cell}>
        <Badge variant={STATE_BADGE[claim.state]}>{t(`state.${claim.state}`)}</Badge>
      </td>
      <td className={cell}>{formatDate(new Date(claim.createdAt), locale)}</td>
      <td className={`${cell} text-end`}>
        <ClaimActions claim={claim} />
      </td>
    </tr>
  );
}
