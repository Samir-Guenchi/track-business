'use client';

import { RegisterRequestSchema } from '@trackecom/contracts';
import { Button } from '@trackecom/ui';
import { useLocale, useTranslations } from 'next-intl';
import { identityApi } from '../../lib/api/identity-api';
import { AuthCard } from './auth-card';
import { AuthLink } from './auth-link';
import { FormAlert } from './form-alert';
import { SignupFields } from './signup-fields';
import { useAuthForm } from './use-auth-form';
import { useSignedInRedirect } from './use-signed-in-redirect';

export function SignupForm() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const { next, onSignedIn } = useSignedInRedirect('/onboarding');
  const form = useAuthForm({
    schema: RegisterRequestSchema,
    submit: identityApi.register,
    onSuccess: onSignedIn,
    extra: { locale },
  });
  const footer = (
    <>
      {t('signup.hasAccount')}{' '}
      <AuthLink href={{ pathname: '/login', query: { next } }}>{t('signup.login')}</AuthLink>
    </>
  );
  return (
    <AuthCard title={t('signup.title')} description={t('signup.description')} footer={footer}>
      <form className="flex flex-col gap-4" onSubmit={form.onSubmit} noValidate>
        <FormAlert message={form.apiError} />
        <SignupFields errorFor={form.errorFor} />
        <Button type="submit" loading={form.isPending}>
          {t('signup.submit')}
        </Button>
      </form>
    </AuthCard>
  );
}
