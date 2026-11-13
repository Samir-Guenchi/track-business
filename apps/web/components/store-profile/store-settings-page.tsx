'use client';

import { useTranslations } from 'next-intl';
import { SettingsTabs } from '../settings/settings-tabs';
import { ProfileLoader } from './profile-loader';
import { StoreProfileForm } from './store-profile-form';

/** Settings > Store: the same profile as the onboarding, editable any time. */
export function StoreSettingsPage() {
  const t = useTranslations('storeProfile');
  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t('settingsTitle')}</h1>
        <p className="text-sm text-muted">{t('settingsDescription')}</p>
      </header>
      <SettingsTabs />
      <div className="rounded-panel border border-border bg-surface p-4 sm:p-6">
        <ProfileLoader>
          {(profile) => <StoreProfileForm profile={profile} submitLabel={t('save')} />}
        </ProfileLoader>
      </div>
    </section>
  );
}
