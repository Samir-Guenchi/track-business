'use client';

import { LoginRequestSchema } from '@trackecom/contracts';
import { Button } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { identityApi } from '../../lib/api/identity-api';
import { AuthCard } from './auth-card';
import { EmailField, PasswordField } from './credential-fields';
import { AuthLink } from './auth-link';
import { FormAlert } from './form-alert';
import { useAuthForm } from './use-auth-form';
import { useSignedInRedirect } from './use-signed-in-redirect';

export function LoginForm() {
  const t = useTranslations('auth');
  const { next, onSignedIn } = useSignedInRedirect();
  const form = useAuthForm({
    schema: LoginRequestSchema,
    submit: identityApi.login,
    onSuccess: onSignedIn,
  });
  const footer = (
    <>
      {t('login.noAccount')}{' '}
      <AuthLink href={{ pathname: '/signup', query: { next } }}>{t('login.signup')}</AuthLink>
    </>
  );
  return (
    <AuthCard title={t('login.title')} description={t('login.description')} footer={footer}>
      <form className="flex flex-col gap-4" onSubmit={form.onSubmit} noValidate>
        <FormAlert message={form.apiError} />
        <EmailField errorFor={form.errorFor} />
        <PasswordField errorFor={form.errorFor} />
        <AuthLink href="/forgot-password">{t('login.forgot')}</AuthLink>
        <Button type="submit" loading={form.isPending}>
          {t('login.submit')}
        </Button>
      </form>
    </AuthCard>
  );
}
