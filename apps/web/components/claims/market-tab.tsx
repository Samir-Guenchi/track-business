'use client';

import {
  BENCHMARK_MIN_PARCELS,
  BENCHMARK_MIN_STORES,
  type BenchmarkLine,
  type BenchmarkResponse,
} from '@trackecom/contracts';
import { EmptyState, Skeleton } from '@trackecom/ui';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import type { Locale } from '../../i18n/routing';
import { useBenchmarks } from '../../lib/claims/benchmark-view';
import { useWilayas, wilayaLabel } from '../../lib/geo/geo-queries';
import { FormAlert } from '../auth/form-alert';
import { useErrorMessage } from '../auth/use-error-message';
import { MarketTable } from './market-table';

const WINDOWS = [30, 90, 180] as const;

function useWilayaName() {
  const t = useTranslations('claims.market');
  const locale = useLocale() as Locale;
  const wilayas = useWilayas().data?.items ?? [];
  return (code: number | null) => {
    const wilaya = wilayas.find((entry) => entry.code === code);
    if (wilaya) return wilayaLabel(wilaya, locale);
    return code === null ? t('unknownWilaya') : String(code);
  };
}

function PeriodSelect(props: { value: number; onChange: (days: number) => void }) {
  const t = useTranslations('claims.market');
  return (
    <label className="flex items-center gap-2 text-sm">
      {t('window')}
      <select
        className="rounded-control border border-border bg-surface px-2 py-1"
        value={props.value}
        onChange={(event) => props.onChange(Number(event.currentTarget.value))}
      >
        {WINDOWS.map((window) => (
          <option key={window} value={window}>
            {t('days', { count: window })}
          </option>
        ))}
      </select>
    </label>
  );
}

function MarketTables({ data }: { readonly data: BenchmarkResponse }) {
  const t = useTranslations('claims.market');
  const wilayaName = useWilayaName();
  if (data.wilayas.length === 0) {
    return <EmptyState title={t('empty.title')} description={t('empty.description')} />;
  }
  const carrierLabel = (line: BenchmarkLine) =>
    `${line.carrier ?? ''} → ${wilayaName(line.wilayaCode)}`;
  return (
    <>
      <MarketTable
        title={t('byWilaya')}
        lines={data.wilayas}
        label={(line) => wilayaName(line.wilayaCode)}
      />
      <MarketTable
        title={t('byCarrier')}
        lines={data.carriers.filter((line) => line.own)}
        label={carrierLabel}
      />
    </>
  );
}

/** "You vs the market" (#200): is a low delivery rate the store's, or the wilaya's? */
export function MarketTab() {
  const t = useTranslations('claims.market');
  const [days, setDays] = useState<number>(30);
  const benchmarks = useBenchmarks(days);
  const errorMessage = useErrorMessage();
  return (
    <div className="mt-3 flex flex-col gap-4">
      <p className="text-sm text-muted">
        {t('hint', { stores: BENCHMARK_MIN_STORES, parcels: BENCHMARK_MIN_PARCELS })}
      </p>
      <PeriodSelect value={days} onChange={setDays} />
      {benchmarks.isPending && <Skeleton className="h-40" />}
      <FormAlert message={benchmarks.isError ? errorMessage(benchmarks.error) : null} />
      {benchmarks.data && <MarketTables data={benchmarks.data} />}
    </div>
  );
}
