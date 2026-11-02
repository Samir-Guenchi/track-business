'use client';

import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { identityApi } from '../../lib/api/identity-api';
import { AuthCard } from './auth-card';
import { AuthLink } from './auth-link';
import { FormAlert } from './form-alert';
import { useErrorMessage } from './use-error-message';
import { useLinkToken } from './use-link-token';

export function VerifyEmail() {
  const t = useTranslations('auth');
  const token = useLinkToken();
  const errorMessage = useErrorMessage();
  const { mutate, isSuccess, isError, error } = useMutation({
    mutationFn: identityApi.verifyEmail,
  });
  useEffect(() => {
    if (token) mutate({ token });
  }, [token, mutate]);

  const message = !token ? t('missingToken') : isError ? errorMessage(error) : null;
  return (
    <AuthCard title={t('verify.title')}>
      {message && <FormAlert message={message} />}
      {isSuccess && <FormAlert tone="success" message={t('verify.done')} />}
      {!message && !isSuccess && <p className="text-sm text-muted">{t('verify.pending')}</p>}
      {isSuccess && <AuthLink href="/">{t('verify.continue')}</AuthLink>}
    </AuthCard>
  );
}
