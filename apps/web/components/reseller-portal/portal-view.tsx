'use client';

import type { ResellerOrder, ResellerPortal, ResellerStats, Wilaya } from '@trackecom/contracts';
import { useTranslations } from 'next-intl';
import { ResellerOrders } from '../resellers/reseller-orders';
import { PortalOrderForm } from './portal-order-form';

const STATS = ['marginPending', 'marginEarned', 'marginPaid'] as const;

interface Props {
  readonly code: string;
  readonly portal: ResellerPortal;
  readonly wilayas: readonly Wilaya[];
}

function Masthead() {
  const t = useTranslations('resellerPortal');
  return (
    <header className="studio-portal__masthead">
      <span className="studio-portal__brand">
        <img src="/brand/trackecom-icon.svg" alt="" width={26} height={26} />
        <span dir="ltr">TrackEcom</span>
      </span>
      <span className="studio-portal__tag">{t('title')}</span>
    </header>
  );
}

function Hero({ name }: { readonly name: string }) {
  const t = useTranslations('resellerPortal');
  return (
    <section className="studio-portal__hero">
      <div className="studio-portal__hero-copy">
        <p className="studio-eyebrow">{t('eyebrow')}</p>
        <h1>
          {t('hello', { name })}
          <span className="studio-frame__dot">.</span>
        </h1>
        <p>{t('description')}</p>
      </div>
      <span className="studio-portal__private">{t('private')}</span>
    </section>
  );
}

function Stats({ stats }: { readonly stats: ResellerStats }) {
  const t = useTranslations('resellerPortal');
  return (
    <dl className="studio-portal__stats">
      {STATS.map((key) => (
        <div
          key={key}
          className={`studio-portal-stat${key === 'marginEarned' ? ' studio-portal-stat--emphasis' : ''}`}
        >
          <dt>{t(`stats.${key}`)}</dt>
          <dd>{t('dinars', { amount: stats[key] })}</dd>
        </div>
      ))}
    </dl>
  );
}

function NewOrderPanel({ code, portal, wilayas }: Props) {
  const t = useTranslations('resellerPortal');
  return (
    <section className="studio-portal__panel" aria-labelledby="portal-new">
      <header className="studio-portal__panel-head">
        <div>
          <h2 id="portal-new">{t('newOrder')}</h2>
          <p>{t('newOrderHint')}</p>
        </div>
        <span className="studio-portal__step" aria-hidden="true">
          01
        </span>
      </header>
      <div className="studio-portal__panel-body">
        {portal.active ? (
          <PortalOrderForm code={code} catalogue={portal.catalogue} wilayas={wilayas} />
        ) : (
          <p className="studio-portal__paused">{t('errors.paused')}</p>
        )}
      </div>
    </section>
  );
}

function OrdersPanel({ orders }: { readonly orders: readonly ResellerOrder[] }) {
  const t = useTranslations('resellerPortal');
  return (
    <section className="studio-portal__panel" aria-labelledby="portal-orders">
      <header className="studio-portal__panel-head">
        <div>
          <h2 id="portal-orders">{t('orders')}</h2>
          <p>{t('ordersHint')}</p>
        </div>
        <span className="studio-portal__step" aria-hidden="true">
          02
        </span>
      </header>
      <div className="studio-portal__panel-body studio-portal__panel-body--flush">
        <ResellerOrders items={orders} />
      </div>
    </section>
  );
}

function Footer() {
  const t = useTranslations('resellerPortal');
  return (
    <footer className="studio-portal__footer">
      <span>{t('footer.brand')}</span>
      <span>{t('footer.private')}</span>
    </footer>
  );
}

/** The reseller's own page: margins, a new order, and their orders only (#198). */
export function PortalView({ code, portal, wilayas }: Props) {
  return (
    <div className="studio-portal-page">
      <div className="studio-portal">
        <Masthead />
        <Hero name={portal.name} />
        <Stats stats={portal.stats} />
        <NewOrderPanel code={code} portal={portal} wilayas={wilayas} />
        <OrdersPanel orders={portal.orders} />
        <Footer />
      </div>
    </div>
  );
}
