'use client';

import type { Reseller } from '@trackecom/contracts';
import { Badge, Button } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { looksRisky, portalPath, ratePercent } from '../../lib/resellers/reseller-view';
import {
  usePayReseller,
  useResellerOrders,
  useUpdateReseller,
} from '../../lib/resellers/resellers-queries';
import { PortalLink } from './portal-link';
import { ResellerOrders } from './reseller-orders';

const card = 'flex flex-col gap-3 rounded-panel border border-border bg-surface p-5 shadow-panel';

function Stats({ reseller }: { readonly reseller: Reseller }) {
  const t = useTranslations('resellers');
  const { stats } = reseller;
  const rate = ratePercent(stats);
  return (
    <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
      <Stat label={t('stats.orders')} value={String(stats.orders)} />
      <Stat label={t('stats.rate')} value={rate === null ? '—' : `${rate} %`} />
      <Stat label={t('stats.pending')} value={t('dinars', { amount: stats.marginPending })} />
      <Stat label={t('stats.earned')} value={t('dinars', { amount: stats.marginEarned })} />
    </dl>
  );
}

function Stat({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Actions({ reseller }: { readonly reseller: Reseller }) {
  const t = useTranslations('resellers');
  const update = useUpdateReseller(reseller.id);
  const pay = usePayReseller(reseller.id);
  const toggle = () =>
    update.mutate({ name: reseller.name, phone: reseller.phone, active: !reseller.active });
  return (
    <div className="flex flex-wrap items-center gap-2">
      {reseller.stats.marginEarned > 0 && (
        <Button size="sm" loading={pay.isPending} onClick={() => pay.mutate()}>
          {t('pay', { amount: reseller.stats.marginEarned })}
        </Button>
      )}
      <Button size="sm" variant="secondary" loading={update.isPending} onClick={toggle}>
        {t(reseller.active ? 'pause' : 'resume')}
      </Button>
      {pay.data && (
        <span role="status" className="text-sm text-tape">
          {t('paid', pay.data)}
        </span>
      )}
    </div>
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
    <li className={card}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{reseller.name}</h2>
        <span className="flex gap-2">
          {looksRisky(reseller.stats) && <Badge variant="warning">{t('risky')}</Badge>}
          <Badge variant={reseller.active ? 'success' : 'neutral'}>
            {t(reseller.active ? 'active' : 'paused')}
          </Badge>
        </span>
      </header>
      <Stats reseller={reseller} />
      <PortalLink path={portalPath(reseller.portalCode)} />
      <Actions reseller={reseller} />
      <Button size="sm" variant="ghost" className="self-start" onClick={() => setOpen(!open)}>
        {t(open ? 'hideOrders' : 'showOrders')}
      </Button>
      {open && <Orders id={reseller.id} />}
    </li>
  );
}
