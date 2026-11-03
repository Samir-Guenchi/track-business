'use client';

import { EmptyState, Skeleton } from '@trackecom/ui';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import type { Locale } from '../../i18n/routing';
import { useScorecard } from '../../lib/claims/claims-queries';
import { groupByWilaya } from '../../lib/claims/scorecard-view';
import { useWilayas, wilayaLabel } from '../../lib/geo/geo-queries';
import { FormAlert } from '../auth/form-alert';
import { useErrorMessage } from '../auth/use-error-message';
import { ScorecardTable } from './scorecard-table';

const WINDOWS = [30, 90, 180, 365] as const;

/** Carriers ranked store-wide and per destination wilaya, over a chosen period. */
export function ScorecardTab() {
  const t = useTranslations('claims.scorecard');
  const [days, setDays] = useState<number>(90);
  const card = useScorecard(days);
  const errorMessage = useErrorMessage();
  return (
    <div className="mt-3 flex flex-col gap-4">
      <label className="flex items-center gap-2 text-sm">
        {t('window')}
        <select
          className="rounded-control border border-border bg-surface px-2 py-1"
          value={days}
          onChange={(event) => setDays(Number(event.currentTarget.value))}
        >
          {WINDOWS.map((window) => (
            <option key={window} value={window}>
              {t('days', { count: window })}
            </option>
          ))}
        </select>
      </label>
      {card.isPending && <Skeleton className="h-40" />}
      <FormAlert message={card.isError ? errorMessage(card.error) : null} />
      {card.data && card.data.carriers.length === 0 && (
        <EmptyState title={t('empty.title')} description={t('empty.description')} />
      )}
      {card.data && card.data.carriers.length > 0 && (
        <>
          <ScorecardTable title={t('storeWide')} scores={card.data.carriers} />
          <h2 className="text-lg font-semibold">{t('byWilaya')}</h2>
          <WilayaTables scores={card.data.byWilaya} />
        </>
      )}
    </div>
  );
}

function WilayaTables({ scores }: { readonly scores: Parameters<typeof groupByWilaya>[0] }) {
  const t = useTranslations('claims.scorecard');
  const locale = useLocale() as Locale;
  const wilayas = useWilayas().data?.items ?? [];
  const name = (code: number | null) => {
    const wilaya = wilayas.find((entry) => entry.code === code);
    if (wilaya) return wilayaLabel(wilaya, locale);
    return code === null ? t('unknownWilaya') : String(code);
  };
  return groupByWilaya(scores).map((group) => (
    <ScorecardTable
      key={group.wilayaCode ?? 'none'}
      title={name(group.wilayaCode)}
      scores={group.scores}
    />
  ));
}
