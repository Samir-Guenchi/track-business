'use client';

import type { Order } from '@trackecom/contracts';
import { Repeat } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '../../../i18n/navigation';

/** On an exchange order: which order it replaces and what the courier must bring back. */
export function ExchangeBanner({ order }: { readonly order: Order }) {
  const t = useTranslations('orders.exchange');
  if (!order.exchange) return null;
  return (
    <aside className="flex items-start gap-3 rounded-panel border border-border bg-surface p-4 text-sm">
      <Repeat size={18} aria-hidden className="mt-0.5 shrink-0 text-tape" />
      <div className="flex flex-col gap-1">
        <p className="font-medium">
          {t('bannerTitle')}{' '}
          <Link href={`/orders/${order.exchange.ofOrderId}`} className="text-tape underline">
            {t('original')}
          </Link>
        </p>
        <p dir="auto">{t('collect', { items: order.exchange.collect })}</p>
      </div>
    </aside>
  );
}
