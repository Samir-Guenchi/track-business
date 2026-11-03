'use client';

import { Skeleton } from '@trackecom/ui';
import { useFormatter, useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';
import { useHeldParcels } from '../../lib/pickup-points/pickup-queries';
import { ReleaseForm } from './release-form';

/** Parcels waiting at the shop, each with its release form. */
export function HeldParcels({ pointId }: { readonly pointId: string }) {
  const t = useTranslations('pickupPoints.held');
  const format = useFormatter();
  const parcels = useHeldParcels(pointId);
  if (parcels.isPending) return <Skeleton className="h-16" />;
  const items = parcels.data?.items ?? [];
  if (items.length === 0) return <p className="text-sm text-muted">{t('empty')}</p>;
  return (
    <ul className="flex flex-col gap-3" aria-label={t('label')}>
      {items.map((parcel) => (
        <li key={parcel.shipmentId} className="flex flex-col gap-2 border-t border-border pt-3">
          <p className="flex flex-wrap gap-3 text-sm">
            <Link href={`/orders/${parcel.orderId}`} className="font-medium text-tape underline">
              <span dir="ltr">{parcel.trackingNumber}</span>
            </Link>
            <span className="text-muted">
              {t('since', {
                date: format.dateTime(new Date(parcel.droppedAt), { dateStyle: 'medium' }),
              })}
            </span>
          </p>
          <ReleaseForm pointId={pointId} parcel={parcel} />
        </li>
      ))}
    </ul>
  );
}
