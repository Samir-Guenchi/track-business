'use client';

import type { Reseller } from '@trackecom/contracts';
import { Button } from '@trackecom/ui';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { portalPath, ratePercent } from '../../lib/resellers/reseller-view';
import {
  usePayReseller,
  useResellerOrders,
  useUpdateReseller,
} from '../../lib/resellers/resellers-queries';
import { PortalLink } from './portal-link';
import { ResellerIdentity } from './reseller-identity';
import { ResellerOrders } from './reseller-orders';

function Stat({
  label,
  value,
  due = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly due?: boolean;
}) {
  return (
    <div className="studio-reseller__stat">
      <dt>{label}</dt>
      <dd className={`studio-reseller__amount${due ? ' studio-reseller__amount--due' : ''}`}>
        {value}
      </dd>
    </div>
  );
}

function Stats({ reseller }: { readonly reseller: Reseller }) {
  const t = useTranslations('resellers');
  const { stats } = reseller;
  const rate = ratePercent(stats);
  return (
    <dl className="studio-reseller__stats">
      <Stat label={t('stats.orders')} value={String(stats.orders)} />
      <Stat label={t('stats.rate')} value={rate === null ? '—' : `${rate} %`} />
      <Stat label={t('stats.pending')} value={t('dinars', { amount: stats.marginPending })} />
      <Stat
        label={t('stats.earned')}
        value={t('dinars', { amount: stats.marginEarned })}
        due={stats.marginEarned > 0}
      />
    </dl>
  );
}

function Actions({ reseller }: { readonly reseller: Reseller }) {
  const t = useTranslations('resellers');
  const update = useUpdateReseller(reseller.id);
  const pay = usePayReseller(reseller.id);
  const toggle = () =>
    update.mutate({ name: reseller.name, phone: reseller.phone, active: !reseller.active });
  return (
    <>
      {reseller.stats.marginEarned > 0 && (
        <Button size="sm" loading={pay.isPending} onClick={() => pay.mutate()}>
          {t('pay', { amount: reseller.stats.marginEarned })}
        </Button>
      )}
      <Button size="sm" variant="secondary" loading={update.isPending} onClick={toggle}>
        {t(reseller.active ? 'pause' : 'resume')}
      </Button>
      {pay.data && (
        <p role="status" className="studio-reseller__notice">
          {t('paid', pay.data)}
        </p>
      )}
    </>
  );
}

function Orders({ id }: { readonly id: string }) {
  const orders = useResellerOrders(id);
  return <ResellerOrders items={orders.data?.items ?? []} />;
}

/** One reseller: delivery rate, margins owed, portal link, pause and pay. */
export function ResellerCard({ reseller }: { readonly reseller: Reseller }) {
  const t = useTranslations('resellers');
  const [open, setOpen] = useState(false);
  return (
    <li className="studio-reseller">
      <ResellerIdentity reseller={reseller} />
      <Stats reseller={reseller} />
      <PortalLink path={portalPath(reseller.portalCode)} />
      <div className="studio-reseller__actions">
        <Actions reseller={reseller} />
        <Button
          size="sm"
          variant="ghost"
          className="studio-reseller__toggle"
          aria-controls={`reseller-orders-${reseller.id}`}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {t(open ? 'hideOrders' : 'showOrders')}
          {open ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
        </Button>
      </div>
      {open && (
        <div id={`reseller-orders-${reseller.id}`} className="studio-reseller__orders">
          <Orders id={reseller.id} />
        </div>
      )}
    </li>
  );
}
