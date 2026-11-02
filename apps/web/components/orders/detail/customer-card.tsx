'use client';

import type { Order } from '@trackecom/contracts';
import { useLocale, useTranslations } from 'next-intl';
import { useCommunes, useWilayas, wilayaLabel } from '../../../lib/geo/geo-queries';
import { DetailCard, DetailRow } from './detail-card';

/** "12 rue X, Bab Ezzouar, 16 · Alger" in the reader's language, once reference data is loaded. */
function usePlaceName(customer: Order['customer']): string {
  const locale = useLocale();
  const wilaya = useWilayas().data?.items.find((item) => item.code === customer.wilayaCode);
  const commune = useCommunes(customer.wilayaCode).data?.items.find(
    (item) => item.id === customer.communeId,
  );
  const communeName = commune && (locale === 'ar' ? commune.nameAr : commune.nameFr);
  return [customer.address, communeName, wilaya && wilayaLabel(wilaya, locale)]
    .filter(Boolean)
    .join(', ');
}

function PhoneLinks({ customer }: { readonly customer: Order['customer'] }) {
  return (
    <>
      <a href={`tel:${customer.phone}`} dir="ltr" className="text-tape underline">
        {customer.phone}
      </a>
      {customer.phone2 && (
        <span dir="ltr" className="block">
          {customer.phone2}
        </span>
      )}
    </>
  );
}

export function CustomerCard({ order }: { readonly order: Order }) {
  const t = useTranslations('orders.detail');
  const place = usePlaceName(order.customer);
  return (
    <DetailCard title={t('customer')}>
      <dl className="flex flex-col gap-2">
        <DetailRow label={t('customer')}>{order.customer.name}</DetailRow>
        <DetailRow label={t('phone')}>
          <PhoneLinks customer={order.customer} />
        </DetailRow>
        <DetailRow label={t('address')}>{place}</DetailRow>
        <DetailRow label={t('delivery')}>
          {t(order.deliveryType === 'home' ? 'home' : 'stopdesk')}
        </DetailRow>
        {order.trackingNumber && (
          <DetailRow label={t('tracking')}>
            <span dir="ltr">
              {order.carrier} · {order.trackingNumber}
            </span>
          </DetailRow>
        )}
      </dl>
    </DetailCard>
  );
}
