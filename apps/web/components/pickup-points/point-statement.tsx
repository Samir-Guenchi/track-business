'use client';

import { useTranslations } from 'next-intl';
import { usePickupStatement } from '../../lib/pickup-points/pickup-queries';
import { currentMonth } from '../../lib/pickup-points/point-draft';

/** This month at the shop: parcels released, fees owed to it, cash taken and handed over. */
export function PointStatement({ pointId }: { readonly pointId: string }) {
  const t = useTranslations('pickupPoints.statement');
  const statement = usePickupStatement(pointId, currentMonth(new Date())).data;
  if (!statement) return null;
  return (
    <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
      {(['released', 'fees', 'cashCollected', 'cashHandedOver'] as const).map((key) => (
        <div key={key} className="flex flex-col">
          <dt className="text-muted">{t(key)}</dt>
          <dd className="font-medium">
            {key === 'released' ? statement[key] : t('dinars', { amount: statement[key] })}
          </dd>
        </div>
      ))}
    </dl>
  );
}
