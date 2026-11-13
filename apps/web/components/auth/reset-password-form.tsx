'use client';

import { ResetPasswordRequestSchema } from '@trackecom/contracts';
import { Button } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { identityApi } from '../../lib/api/identity-api';
import { AuthCard } from './auth-card';
import { PasswordField } from './credential-fields';
import { AuthLink } from './auth-link';
import { FormAlert } from './form-alert';
import { useAuthForm } from './use-auth-form';
import { useLinkToken } from './use-link-token';

export function ResetPasswordForm() {
  const t = useTranslations('auth');
  const token = useLinkToken();
  const form = useAuthForm({
    schema: ResetPasswordRequestSchema,
    submit: identityApi.resetPassword,
    extra: { token },
  });
  if (!token || form.isSuccess) {
    return (
      <AuthCard title={t('reset.title')}>
        {token ? (
          <FormAlert tone="success" message={t('reset.done')} />
        ) : (
          <FormAlert message={t('missingToken')} />
        )}
        {token && <AuthLink href="/login">{t('reset.login')}</AuthLink>}
      </AuthCard>
    );
  }
  return (
    <AuthCard title={t('reset.title')}>
      <form className="flex flex-col gap-4" onSubmit={form.onSubmit} noValidate>
        <FormAlert message={form.apiError} />
        <PasswordField errorFor={form.errorFor} isNew isReplacement />
        <Button type="submit" loading={form.isPending}>
          {t('reset.submit')}
        </Button>
      </form>
    </AuthCard>
  );
}
