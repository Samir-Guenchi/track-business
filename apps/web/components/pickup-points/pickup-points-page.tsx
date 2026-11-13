'use client';

import { Button, EmptyState, Skeleton } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { usePickupPoints } from '../../lib/pickup-points/pickup-queries';
import { FormAlert } from '../auth/form-alert';
import { useErrorMessage } from '../auth/use-error-message';
import { PointCard } from './point-card';
import { PointForm } from './point-form';

/** Partner shops that hold parcels for customers far from a carrier desk (#202). */
export function PickupPointsPage() {
  const t = useTranslations('pickupPoints');
  const points = usePickupPoints();
  const errorMessage = useErrorMessage();
  const [adding, setAdding] = useState(false);
  const items = points.data?.items ?? [];
  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-muted">{t('description')}</p>
        </div>
        {!adding && <Button onClick={() => setAdding(true)}>{t('add')}</Button>}
      </header>
      {adding && (
        <div className="rounded-panel border border-border bg-surface p-5 shadow-panel">
          <PointForm onDone={() => setAdding(false)} />
        </div>
      )}
      <FormAlert message={points.isError ? errorMessage(points.error) : null} />
      {points.isPending && <Skeleton className="h-40" />}
      {points.isSuccess && items.length === 0 && !adding && (
        <EmptyState title={t('empty.title')} description={t('empty.description')} />
      )}
      <ul className="flex flex-col gap-4" aria-label={t('title')}>
        {items.map((point) => (
          <PointCard key={point.id} point={point} />
        ))}
      </ul>
    </section>
  );
}
