'use client';

import type { Order } from '@trackecom/contracts';
import { MoneyDZD } from '@trackecom/ui';
import { useLocale, useTranslations } from 'next-intl';
import { isLocale } from '../../../i18n/routing';
import { DetailCard, DetailRow } from './detail-card';

export function ItemsCard({ order }: { readonly order: Order }) {
  const t = useTranslations('orders.detail');
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ? rawLocale : 'fr';
  const money = (amount: number) => <MoneyDZD amount={amount} locale={locale} />;
  return (
    <DetailCard title={t('items')}>
      <ul className="flex flex-col gap-2">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 text-sm">
            <span>
              {item.name} <span className="text-muted">× {item.quantity}</span>
            </span>
            {money(item.lineTotal)}
          </li>
        ))}
      </ul>
      <dl className="flex flex-col gap-1 border-t border-border pt-3">
        <DetailRow label={t('subtotal')}>{money(order.subtotal)}</DetailRow>
        <DetailRow label={t('shipping')}>{money(order.shippingFee)}</DetailRow>
        {order.discount > 0 && (
          <DetailRow label={t('discount')}>− {money(order.discount)}</DetailRow>
        )}
        <DetailRow label={t('cod')}>
          <span className="text-lg">{money(order.codAmount)}</span>
        </DetailRow>
      </dl>
      {order.notes && (
        <p className="text-sm text-muted">
          {t('notes')}: {order.notes}
        </p>
      )}
    </DetailCard>
  );
}
