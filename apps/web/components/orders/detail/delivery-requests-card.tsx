'use client';

import { useTranslations } from 'next-intl';
import { useDeliveryRequests } from '../../../lib/delivery-requests/delivery-requests-queries';
import { RequestRow } from '../../delivery-requests/request-row';
import { DetailCard } from './detail-card';

/** What the customer asked from their tracking link (#136); hidden when they asked nothing. */
export function DeliveryRequestsCard({ orderId }: { readonly orderId: string }) {
  const t = useTranslations('deliveryRequests');
  const requests = useDeliveryRequests({ orderId });
  const items = requests.data?.items ?? [];
  if (items.length === 0) return null;
  return (
    <DetailCard title={t('orderCard')}>
      <ul className="flex flex-col divide-y divide-border">
        {items.map((item) => (
          <RequestRow key={item.id} item={item} />
        ))}
      </ul>
    </DetailCard>
  );
}
