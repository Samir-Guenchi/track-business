'use client';

import { ForgotPasswordRequestSchema } from '@trackecom/contracts';
import { Button } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { identityApi } from '../../lib/api/identity-api';
import { AuthLink } from './auth-link';
import { AuthCard } from './auth-card';
import { EmailField } from './credential-fields';
import { FormAlert } from './form-alert';
import { useAuthForm } from './use-auth-form';

export function ForgotPasswordForm() {
  const t = useTranslations('auth');
  const form = useAuthForm({
    schema: ForgotPasswordRequestSchema,
    submit: identityApi.forgotPassword,
  });
  const footer = <AuthLink href="/login">{t('forgot.back')}</AuthLink>;
  return (
    <AuthCard title={t('forgot.title')} description={t('forgot.description')} footer={footer}>
      {form.isSuccess ? (
        // Same answer whether or not the account exists, so nobody can probe for emails.
        <FormAlert tone="success" message={t('forgot.sent')} />
      ) : (
        <form className="flex flex-col gap-4" onSubmit={form.onSubmit} noValidate>
          <FormAlert message={form.apiError} />
          <EmailField errorFor={form.errorFor} />
          <Button type="submit" loading={form.isPending}>
            {t('forgot.submit')}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
