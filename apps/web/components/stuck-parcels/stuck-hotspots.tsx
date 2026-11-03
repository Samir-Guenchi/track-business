'use client';

import type { StuckParcelsResponse } from '@trackecom/contracts';
import { useTranslations } from 'next-intl';

interface Props {
  readonly hotspots: StuckParcelsResponse['hotspots'];
  readonly wilayaName: (code: number | null) => string;
}

/** Carrier and wilaya pairs where several parcels are stuck at once: likely a hub problem. */
export function StuckHotspots({ hotspots, wilayaName }: Props) {
  const t = useTranslations('stuckParcels.hotspots');
  if (hotspots.length === 0) return null;
  return (
    <section
      aria-label={t('title')}
      className="rounded-panel border border-border bg-surface p-3 shadow-panel"
    >
      <h2 className="font-semibold">{t('title')}</h2>
      <p className="text-sm text-muted">{t('hint')}</p>
      <ul className="mt-2 flex flex-col gap-1 text-sm">
        {hotspots.map((spot) => (
          <li key={`${spot.carrier}-${spot.toWilayaCode ?? 'none'}`}>
            {t('line', {
              count: spot.count,
              carrier: spot.carrier,
              wilaya: wilayaName(spot.toWilayaCode),
            })}
          </li>
        ))}
      </ul>
    </section>
  );
}
