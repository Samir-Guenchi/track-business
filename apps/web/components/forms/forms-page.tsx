'use client';

import type { OrderForm } from '@trackecom/contracts';
import { Button, EmptyState, Skeleton } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useOrderForms } from '../../lib/forms/forms-queries';
import { FormAlert } from '../auth/form-alert';
import { FormCard } from './form-card';
import { FormEditor } from './form-editor';

type Editing = 'none' | 'new' | OrderForm;

/** The seller's COD order forms (#134): one per landing page, with the line to paste. */
export function FormsPage() {
  const t = useTranslations('forms');
  const forms = useOrderForms();
  const [editing, setEditing] = useState<Editing>('none');
  const [saved, setSaved] = useState<string | null>(null);
  const close = (message: string | null) => {
    setEditing('none');
    setSaved(message);
  };
  const items = forms.data?.items ?? [];
  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-muted">{t('subtitle')}</p>
        </div>
        {editing === 'none' && <Button onClick={() => setEditing('new')}>{t('new')}</Button>}
      </header>
      <FormAlert tone="success" message={saved} />
      {editing !== 'none' && (
        <FormEditor
          form={editing === 'new' ? null : editing}
          onClose={(done) => close(done ? t('saved') : null)}
        />
      )}
      {forms.isPending && <Skeleton className="h-40" />}
      {forms.isSuccess && items.length === 0 && editing === 'none' && (
        <EmptyState title={t('title')} description={t('empty')} />
      )}
      <ul className="flex flex-col gap-3">
        {items.map((form) => (
          <FormCard key={form.id} form={form} onEdit={() => setEditing(form)} />
        ))}
      </ul>
    </section>
  );
}
