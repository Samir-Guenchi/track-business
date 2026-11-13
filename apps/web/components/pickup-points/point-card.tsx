'use client';

import type { PickupPoint } from '@trackecom/contracts';
import { Badge, Button } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useHandover } from '../../lib/pickup-points/pickup-queries';
import { DropForm } from './drop-form';
import { HeldParcels } from './held-parcels';
import { PointForm } from './point-form';
import { PointStatement } from './point-statement';

const card = 'flex flex-col gap-4 rounded-panel border border-border bg-surface p-5 shadow-panel';

function PointHeader({
  point,
  onEdit,
}: {
  readonly point: PickupPoint;
  readonly onEdit: () => void;
}) {
  const t = useTranslations('pickupPoints');
  return (
    <header className="flex flex-wrap items-start justify-between gap-2">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{point.name}</h2>
        <p className="text-sm text-muted">{point.address}</p>
        <p className="text-sm text-muted" dir="ltr">
          {point.phone}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={point.active ? 'success' : 'neutral'}>
          {t(point.active ? 'active' : 'inactive')}
        </Badge>
        <Button size="sm" variant="ghost" onClick={onEdit}>
          {t('edit')}
        </Button>
      </div>
    </header>
  );
}

function CashLine({ point }: { readonly point: PickupPoint }) {
  const t = useTranslations('pickupPoints');
  const handover = useHandover(point.id);
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span>{t('holding', { holding: point.holding, capacity: point.capacity })}</span>
      <span className="font-medium">{t('cashToCollect', { amount: point.cashToCollect })}</span>
      {point.cashToCollect > 0 && (
        <Button size="sm" loading={handover.isPending} onClick={() => handover.mutate()}>
          {t('handover')}
        </Button>
      )}
      {handover.data && (
        <span role="status" className="text-tape">
          {t('handedOver', handover.data)}
        </span>
      )}
    </div>
  );
}

/** One partner shop: what it holds, the cash it owes, and the counter actions. */
export function PointCard({ point }: { readonly point: PickupPoint }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <li className={card}>
        <PointForm point={point} onDone={() => setEditing(false)} />
      </li>
    );
  }
  return (
    <li className={card}>
      <PointHeader point={point} onEdit={() => setEditing(true)} />
      <CashLine point={point} />
      <PointStatement pointId={point.id} />
      <DropForm pointId={point.id} />
      <HeldParcels pointId={point.id} />
    </li>
  );
}
