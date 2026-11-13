'use client';

import type { CarrierScore } from '@trackecom/contracts';
import { Badge } from '@trackecom/ui';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '../../i18n/routing';
import { isThin, percent } from '../../lib/claims/scorecard-view';
import { formatDzd } from '../../lib/format';
import { cell, ClaimsTable } from './claims-table';

const COLUMNS = [
  'carrier',
  'parcels',
  'rate',
  'days',
  'damaged',
  'lost',
  'claims',
  'recovered',
] as const;

/** One ranked list of carriers: the store-wide one or one wilaya's. */
export function ScorecardTable({
  title,
  scores,
}: {
  readonly title: string;
  readonly scores: readonly CarrierScore[];
}) {
  const t = useTranslations('claims.scorecard');
  return (
    <section aria-label={title}>
      <h3 className="font-medium">{title}</h3>
      <ClaimsTable label={title} headers={COLUMNS.map((column) => t(`columns.${column}`))}>
        {scores.map((score) => (
          <ScoreRow key={score.carrier} score={score} />
        ))}
      </ClaimsTable>
    </section>
  );
}

function ScoreRow({ score }: { readonly score: CarrierScore }) {
  const t = useTranslations('claims.scorecard');
  const locale = useLocale() as Locale;
  return (
    <tr className="border-t border-border">
      <td className={cell} dir="ltr">
        {score.carrier}
      </td>
      <td className={cell}>{score.parcels}</td>
      <td className={cell}>
        <span className="me-2 font-medium">{percent(score.deliveryRate, locale)}</span>
        {isThin(score) && <Badge title={t('thin')}>{t('thin')}</Badge>}
      </td>
      <td className={cell}>
        {score.avgDeliveryDays === null ? '-' : t('avgDays', { days: score.avgDeliveryDays })}
      </td>
      <td className={cell}>{score.damaged}</td>
      <td className={cell}>{score.lost}</td>
      <td className={cell}>{t('claimsWon', { won: score.claimsWon, total: score.claims })}</td>
      <td className={cell}>{formatDzd(score.recovered, locale)}</td>
    </tr>
  );
}
