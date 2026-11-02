'use client';

import { CreateStoreRequestSchema } from '@trackecom/contracts';
import { Button, Input } from '@trackecom/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { identityApi } from '../../lib/api/identity-api';
import { setActiveStoreId } from '../../lib/session/active-store';
import { sessionKeys } from '../../lib/session/session-queries';
import { useRouter } from '../../i18n/navigation';
import { AuthCard } from '../auth/auth-card';
import { FormAlert } from '../auth/form-alert';
import { useAuthForm } from '../auth/use-auth-form';

// TODO(#160): wilaya of origin, logo, orders per day and current carriers need a store profile endpoint in identity.
export function CreateStoreForm() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useAuthForm({
    schema: CreateStoreRequestSchema,
    submit: identityApi.createStore,
    onSuccess: async (store) => {
      setActiveStoreId(store.id);
      await queryClient.invalidateQueries({ queryKey: sessionKeys.stores });
      router.replace('/');
    },
  });
  return (
    <AuthCard title={t('title')} description={t('description')}>
      <form className="flex flex-col gap-4" onSubmit={form.onSubmit} noValidate>
        <FormAlert message={form.apiError} />
        <Input
          name="name"
          required
          autoFocus
          label={t('storeName')}
          {...form.errorFor('name', t('storeNameInvalid'))}
        />
        <Button type="submit" loading={form.isPending}>
          {t('submit')}
        </Button>
      </form>
    </AuthCard>
  );
}
