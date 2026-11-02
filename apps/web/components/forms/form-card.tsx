'use client';

import type { OrderForm } from '@trackecom/contracts';
import { Badge, Button } from '@trackecom/ui';
import { ExternalLink } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { requestOf, draftFromForm } from '../../lib/forms/form-editor';
import { useSaveOrderForm } from '../../lib/forms/forms-queries';
import { EmbedSnippet } from './embed-snippet';

interface FormCardProps {
  readonly form: OrderForm;
  readonly onEdit: () => void;
}

export function FormCard({ form, onEdit }: FormCardProps) {
  const t = useTranslations('forms');
  const save = useSaveOrderForm();
  const toggle = () =>
    save.mutate({ id: form.id, body: requestOf(draftFromForm(form)), enabled: !form.enabled });
  return (
    <li className="flex flex-col gap-3 rounded-panel border border-border bg-surface p-4 shadow-panel">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{form.name}</span>
        <Badge variant={form.enabled ? 'success' : 'neutral'}>
          {form.enabled ? t('enabled') : t('disabled')}
        </Badge>
        <span className="text-sm text-muted">
          {form.title} · {t('products', { count: form.products.length })}
        </span>
      </div>
      {form.enabled && <EmbedSnippet formKey={form.key} />}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={onEdit}>
          {t('edit')}
        </Button>
        <Button variant="ghost" size="sm" loading={save.isPending} onClick={toggle}>
          {form.enabled ? t('disable') : t('enable')}
        </Button>
        {form.enabled && <OpenLink formKey={form.key} />}
      </div>
    </li>
  );
}

function OpenLink({ formKey }: { readonly formKey: string }) {
  const t = useTranslations('forms');
  const locale = useLocale();
  return (
    <a
      href={`/${locale}/f/${formKey}`}
      target="_blank"
      rel="noopener"
      className="tk-button"
      data-variant="ghost"
      data-size="sm"
    >
      <ExternalLink className="size-4" aria-hidden="true" />
      {t('open')}
    </a>
  );
}
