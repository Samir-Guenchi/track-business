'use client';

import { Button } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { useRouter } from '../../i18n/navigation';
import { AuthCard } from '../auth/auth-card';
import { ProfileLoader } from '../store-profile/profile-loader';
import { StoreProfileForm } from '../store-profile/store-profile-form';

/** Second onboarding step: every answer is optional and can be changed in the settings. */
export function StoreProfileStep() {
  const t = useTranslations('storeProfile');
  const router = useRouter();
  const finish = () => router.replace('/');
  return (
    <AuthCard title={t('onboardingTitle')} description={t('onboardingDescription')}>
      <ProfileLoader>
        {(profile) => (
          <StoreProfileForm
            profile={profile}
            submitLabel={t('continue')}
            onSaved={finish}
            actions={
              <Button type="button" variant="ghost" onClick={finish}>
                {t('skip')}
              </Button>
            }
          />
        )}
      </ProfileLoader>
    </AuthCard>
  );
}
