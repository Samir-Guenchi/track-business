'use client';

import { Button, Skeleton } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { FormAlert } from '../auth/form-alert';
import { useSessionGate } from './use-session-gate';

/** Shows the seller app only to a signed-in member of at least one store. */
export function SessionGate({ children }: { readonly children: ReactNode }) {
  const t = useTranslations();
  const { state, retry } = useSessionGate();
  if (state === 'ready') return children;
  if (state === 'error') {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-3 p-8">
        <FormAlert message={t('auth.errors.generic')} />
        <Button variant="secondary" onClick={retry}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }
  return (
    <div className="mx-auto flex max-w-md flex-col gap-3 p-8" aria-busy="true">
      <p className="text-sm text-muted">{t('onboarding.loading')}</p>
      <Skeleton className="h-10" />
      <Skeleton className="h-24" />
    </div>
  );
}
