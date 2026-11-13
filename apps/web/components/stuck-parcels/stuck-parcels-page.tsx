'use client';

import { EmptyState, Skeleton } from '@trackecom/ui';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import type { Locale } from '../../i18n/routing';
import { useWilayas, wilayaLabel } from '../../lib/geo/geo-queries';
import { useStuckParcels } from '../../lib/stuck-parcels/stuck-parcels-queries';
import { carriersOf } from '../../lib/stuck-parcels/stuck-view';
import { FormAlert } from '../auth/form-alert';
import { useErrorMessage } from '../auth/use-error-message';
import { StuckHotspots } from './stuck-hotspots';
import { StuckTable } from './stuck-table';

/** Parcels the carrier has not moved for too long (#197), so the seller calls before the customer gives up. */
export function StuckParcelsPage() {
  const t = useTranslations('stuckParcels');
  const [carrier, setCarrier] = useState('');
  const stuck = useStuckParcels(carrier);
  const errorMessage = useErrorMessage();
  const wilayaName = useWilayaName();
  const items = stuck.data?.items ?? [];
  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted">{t('subtitle')}</p>
      </header>
      <CarrierFilter value={carrier} carriers={carriersOf(items)} onChange={setCarrier} />
      <FormAlert message={stuck.isError ? errorMessage(stuck.error) : null} />
      {stuck.isPending && <Skeleton className="h-48" />}
      {stuck.isSuccess && items.length === 0 && (
        <EmptyState title={t('empty.title')} description={t('empty.description')} />
      )}
      {stuck.data && <StuckHotspots hotspots={stuck.data.hotspots} wilayaName={wilayaName} />}
      {items.length > 0 && <StuckTable items={items} wilayaName={wilayaName} />}
    </section>
  );
}

interface FilterProps {
  readonly value: string;
  readonly carriers: readonly string[];
  readonly onChange: (carrier: string) => void;
}

function CarrierFilter({ value, carriers, onChange }: FilterProps) {
  const t = useTranslations('stuckParcels');
  const options = value && !carriers.includes(value) ? [value, ...carriers] : carriers;
  return (
    <label className="flex items-center gap-2 text-sm">
      {t('carrier')}
      <select
        className="rounded-control border border-border bg-surface px-2 py-1"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      >
        <option value="">{t('allCarriers')}</option>
        {options.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}

function useWilayaName() {
  const t = useTranslations('stuckParcels');
  const locale = useLocale() as Locale;
  const wilayas = useWilayas().data?.items ?? [];
  return (code: number | null) => {
    const wilaya = wilayas.find((item) => item.code === code);
    if (wilaya) return wilayaLabel(wilaya, locale);
    return code === null ? t('unknownWilaya') : String(code);
  };
}
