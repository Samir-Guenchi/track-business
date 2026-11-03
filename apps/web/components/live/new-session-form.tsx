'use client';

import { Button, Input } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { useRouter } from '../../i18n/navigation';
import { useCreateLiveSession } from '../../lib/live/live-queries';
import { type ProductRow, toCreateSession } from '../../lib/live/session-draft';
import { FormAlert } from '../auth/form-alert';
import { useErrorMessage } from '../auth/use-error-message';
import { newRow, ProductRows } from './product-rows';

/** Start a live: a title and the products with their codes. */
export function NewSessionForm() {
  const t = useTranslations('live.new');
  const router = useRouter();
  const create = useCreateLiveSession();
  const errorMessage = useErrorMessage();
  const [title, setTitle] = useState('');
  const [rows, setRows] = useState<ProductRow[]>(() => [newRow([])]);
  const body = toCreateSession(title, rows);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate(body, { onSuccess: (session) => router.push(`/live/${session.id}`) });
  };
  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-panel border border-border bg-surface p-4 shadow-panel"
    >
      <h2 className="text-lg font-semibold">{t('title')}</h2>
      <label className="flex flex-col gap-1 text-sm">
        {t('sessionTitle')}
        <Input
          value={title}
          maxLength={80}
          placeholder={t('sessionPlaceholder')}
          onChange={(e) => setTitle(e.currentTarget.value)}
        />
      </label>
      <ProductRows rows={rows} onChange={setRows} />
      <FormAlert message={create.isError ? errorMessage(create.error) : null} />
      <Button
        type="submit"
        disabled={create.isPending || !body.title || body.products.length === 0}
      >
        {t('start')}
      </Button>
    </form>
  );
}
