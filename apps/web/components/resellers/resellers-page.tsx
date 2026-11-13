'use client';

import { Button, EmptyState, Skeleton } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useResellers } from '../../lib/resellers/resellers-queries';
import { FormAlert } from '../auth/form-alert';
import { useErrorMessage } from '../auth/use-error-message';
import { CatalogueSection } from './catalogue-section';
import { ResellerCard } from './reseller-card';
import { ResellerForm } from './reseller-form';

/** Resellers and affiliates who sell the store's products with their own margin (#198). */
export function ResellersPage() {
  const t = useTranslations('resellers');
  const resellers = useResellers();
  const errorMessage = useErrorMessage();
  const [adding, setAdding] = useState(false);
  const items = resellers.data?.items ?? [];
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
          <ResellerForm onDone={() => setAdding(false)} />
        </div>
      )}
      <FormAlert message={resellers.isError ? errorMessage(resellers.error) : null} />
      {resellers.isPending && <Skeleton className="h-40" />}
      {resellers.isSuccess && items.length === 0 && !adding && (
        <EmptyState title={t('empty.title')} description={t('empty.description')} />
      )}
      <ul className="flex flex-col gap-4" aria-label={t('title')}>
        {items.map((reseller) => (
          <ResellerCard key={reseller.id} reseller={reseller} />
        ))}
      </ul>
      <CatalogueSection />
    </section>
  );
}
