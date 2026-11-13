'use client';

import { Skeleton } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { useLegalProfile } from '../../lib/stores/legal-queries';
import { FormAlert } from '../auth/form-alert';
import { useErrorMessage } from '../auth/use-error-message';
import { SettingsTabs } from '../settings/settings-tabs';
import { LegalForm } from './legal-form';

/** Settings > Legal: what invoices need (#140). */
export function LegalSettingsPage() {
  const t = useTranslations('legal');
  const profile = useLegalProfile();
  const errorMessage = useErrorMessage();
  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted">{t('description')}</p>
      </header>
      <SettingsTabs />
      <div className="rounded-panel border border-border bg-surface p-4 sm:p-6">
        {profile.isPending && <Skeleton className="h-96" />}
        {profile.isError && <FormAlert message={errorMessage(profile.error)} />}
        {profile.data && <LegalForm profile={profile.data} />}
      </div>
    </section>
  );
}
