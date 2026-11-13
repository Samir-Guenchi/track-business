'use client';

import type { PublicPickup } from '@trackecom/contracts';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { fetchPickup } from '../../lib/tracking/pickup-api';

type Pickup = NonNullable<PublicPickup['pickup']>;

const panel = 'flex flex-col gap-3 rounded-panel border border-border bg-surface p-5 shadow-panel';

const mapUrl = (pickup: Pickup) =>
  pickup.lat === null || pickup.lng === null
    ? null
    : `https://www.openstreetmap.org/?mlat=${pickup.lat}&mlon=${pickup.lng}#map=17/${pickup.lat}/${pickup.lng}`;

function PickupCode({ code }: { readonly code: string }) {
  const t = useTranslations('pickupPoints.tracking');
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-muted">{t('codeLabel')}</span>
      <span className="font-mono text-3xl font-semibold tracking-[0.3em]" dir="ltr">
        {code}
      </span>
      <span className="text-xs text-muted">{t('codeHint')}</span>
    </div>
  );
}

/** "Collect your parcel at ..." with the code to read out at the shop (#202). */
export function PickupPanel({ code }: { readonly code: string }) {
  const t = useTranslations('pickupPoints.tracking');
  const [pickup, setPickup] = useState<Pickup | null>(null);
  useEffect(() => {
    fetchPickup(code).then(setPickup, () => setPickup(null));
  }, [code]);
  if (!pickup) return null;
  const map = mapUrl(pickup);
  return (
    <section className={panel} aria-labelledby="pickup-title">
      <h2 id="pickup-title" className="text-lg font-semibold">
        {t(pickup.state === 'held' ? 'title' : 'collected')}
      </h2>
      <p className="font-medium">{pickup.name}</p>
      <p className="text-sm">{pickup.address}</p>
      {pickup.hours && <p className="text-sm text-muted">{t('hours', { hours: pickup.hours })}</p>}
      <div className="flex flex-wrap gap-4 text-sm">
        <a href={`tel:${pickup.phone}`} className="text-tape underline" dir="ltr">
          {pickup.phone}
        </a>
        {map && (
          <a href={map} target="_blank" rel="noreferrer" className="text-tape underline">
            {t('map')}
          </a>
        )}
      </div>
      {pickup.code && <PickupCode code={pickup.code} />}
    </section>
  );
}
