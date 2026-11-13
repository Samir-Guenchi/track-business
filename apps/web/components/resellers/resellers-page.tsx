'use client';

import type { Reseller } from '@trackecom/contracts';
import { Button, Skeleton } from '@trackecom/ui';
import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useResellers } from '../../lib/resellers/resellers-queries';
import { summariseResellers } from '../../lib/resellers/reseller-summary';
import { FormAlert } from '../auth/form-alert';
import { useErrorMessage } from '../auth/use-error-message';
import { CatalogueSection } from './catalogue-section';
import { ResellerCard } from './reseller-card';
import { ResellerForm } from './reseller-form';
import { ResellersSummary } from './resellers-summary';

function PageHead({ adding, onAdd }: { readonly adding: boolean; readonly onAdd: () => void }) {
  const t = useTranslations('resellers');
  return (
    <header className="studio-frame__head">
      <div className="studio-frame__copy">
        <p className="studio-eyebrow">{t('eyebrow')}</p>
        <h1 className="studio-frame__title">
          {t('title')}
          <span className="studio-frame__dot">.</span>
        </h1>
        <p className="studio-frame__lede">{t('description')}</p>
      </div>
      {!adding && (
        <div className="studio-frame__actions">
          <Button onClick={onAdd}>{t('add')}</Button>
        </div>
      )}
    </header>
  );
}

function DirectorySkeleton() {
  return (
    <div className="studio-skeleton" aria-hidden="true">
      <div className="studio-skeleton__stats">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="studio-skeleton__stat" />
        ))}
      </div>
      <Skeleton className="studio-skeleton__card" />
    </div>
  );
}

function EmptyDirectory({ onAdd }: { readonly onAdd: () => void }) {
  const t = useTranslations('resellers');
  return (
    <section className="studio-state">
      <span className="studio-state__icon">
        <Users size={20} aria-hidden />
      </span>
      <h2>{t('empty.title')}</h2>
      <p>{t('empty.description')}</p>
      <Button onClick={onAdd}>{t('add')}</Button>
    </section>
  );
}

function Directory({
  status,
  items,
  adding,
  onAdd,
}: {
  readonly status: 'pending' | 'error' | 'success';
  readonly items: readonly Reseller[];
  readonly adding: boolean;
  readonly onAdd: () => void;
}) {
  const t = useTranslations('resellers');
  if (status === 'pending') return <DirectorySkeleton />;
  if (items.length === 0) return adding ? null : <EmptyDirectory onAdd={onAdd} />;
  return (
    <>
      <ResellersSummary summary={summariseResellers(items)} />
      <section className="studio-section" aria-labelledby="resellers-directory">
        <header className="studio-section__head">
          <div>
            <p className="studio-eyebrow">{t('directory')}</p>
            <h2 id="resellers-directory">{t('directoryTitle')}</h2>
          </div>
          <span className="studio-section__count">{t('count', { count: items.length })}</span>
        </header>
        <ul className="studio-reseller-list">
          {items.map((reseller) => (
            <ResellerCard key={reseller.id} reseller={reseller} />
          ))}
        </ul>
      </section>
    </>
  );
}

/** Resellers and affiliates who sell the store's products with their own margin (#198). */
export function ResellersPage() {
  const resellers = useResellers();
  const errorMessage = useErrorMessage();
  const [adding, setAdding] = useState(false);
  const items = resellers.data?.items ?? [];
  const openForm = () => setAdding(true);
  return (
    <section className="studio-page">
      <div className="studio-frame">
        <PageHead adding={adding} onAdd={openForm} />
        <FormAlert message={resellers.isError ? errorMessage(resellers.error) : null} />
        {adding && <ResellerForm onDone={() => setAdding(false)} />}
        <Directory status={resellers.status} items={items} adding={adding} onAdd={openForm} />
        <CatalogueSection />
      </div>
    </section>
  );
}
