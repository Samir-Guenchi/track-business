'use client';

import type { ResellerPortal, Wilaya } from '@trackecom/contracts';
import { useTranslations } from 'next-intl';
import { ResellerOrders } from '../resellers/reseller-orders';
import { PortalOrderForm } from './portal-order-form';

const panel = 'flex flex-col gap-3 rounded-panel border border-border bg-surface p-5 shadow-panel';

interface Props {
  readonly code: string;
  readonly portal: ResellerPortal;
  readonly wilayas: readonly Wilaya[];
}

/** The reseller's own page: margins, a new order, and their orders only (#198). */
export function PortalView({ code, portal, wilayas }: Props) {
  const t = useTranslations('resellerPortal');
  const { stats } = portal;
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t('hello', { name: portal.name })}</h1>
        <p className="text-sm text-muted">{t('description')}</p>
      </header>
      <dl className="grid grid-cols-3 gap-2 text-sm">
        {(['marginPending', 'marginEarned', 'marginPaid'] as const).map((key) => (
          <div key={key} className="flex flex-col rounded-control border border-border p-3">
            <dt className="text-muted">{t(`stats.${key}`)}</dt>
            <dd className="font-semibold">{t('dinars', { amount: stats[key] })}</dd>
          </div>
        ))}
      </dl>
      <section className={panel} aria-labelledby="portal-new">
        <h2 id="portal-new" className="text-lg font-semibold">
          {t('newOrder')}
        </h2>
        {portal.active ? (
          <PortalOrderForm code={code} catalogue={portal.catalogue} wilayas={wilayas} />
        ) : (
          <p className="text-sm text-stamp">{t('errors.paused')}</p>
        )}
      </section>
      <section className={panel} aria-labelledby="portal-orders">
        <h2 id="portal-orders" className="text-lg font-semibold">
          {t('orders')}
        </h2>
        <ResellerOrders items={portal.orders} />
      </section>
    </div>
  );
}
