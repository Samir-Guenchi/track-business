'use client';

import type { ReturnRequestState } from '@trackecom/contracts';
import { EmptyState, Skeleton } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useReturnRequests } from '../../lib/return-requests/return-requests-queries';
import { FormAlert } from '../auth/form-alert';
import { useErrorMessage } from '../auth/use-error-message';
import { RequestCard } from './request-card';

/** Returns and exchanges customers asked for from their tracking link (#201). */
export function ReturnRequestsPage() {
  const t = useTranslations('returnRequests');
  const [state, setState] = useState<ReturnRequestState | undefined>('pending');
  const requests = useReturnRequests(state);
  const errorMessage = useErrorMessage();
  const items = requests.data?.items ?? [];
  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted">{t('description')}</p>
      </header>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={state === 'pending'}
          onChange={(event) => setState(event.currentTarget.checked ? 'pending' : undefined)}
        />
        {t('pendingOnly')}
      </label>
      <FormAlert message={requests.isError ? errorMessage(requests.error) : null} />
      {requests.isPending && <Skeleton className="h-40" />}
      {requests.isSuccess && items.length === 0 && (
        <EmptyState title={t('empty.title')} description={t('empty.description')} />
      )}
      <ul className="flex flex-col gap-3" aria-label={t('title')}>
        {items.map((item) => (
          <RequestCard key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}
