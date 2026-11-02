'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { identityApi } from '../../lib/api/identity-api';
import { setActiveStoreId } from '../../lib/session/active-store';
import { useMe } from '../../lib/session/session-queries';
import { useRouter } from '../../i18n/navigation';
import { AuthCard } from './auth-card';
import { AuthLink } from './auth-link';
import { FormAlert } from './form-alert';
import { useErrorMessage } from './use-error-message';
import { useLinkToken } from './use-link-token';

function SignInFirst({ token }: { readonly token: string }) {
  const t = useTranslations('auth.invite');
  const next = `/invite?token=${encodeURIComponent(token)}`;
  return (
    <>
      <p className="text-sm text-muted">{t('needAccount')}</p>
      <div className="flex gap-3">
        <AuthLink href={{ pathname: '/login', query: { next } }}>{t('login')}</AuthLink>
        <AuthLink href={{ pathname: '/signup', query: { next } }}>{t('signup')}</AuthLink>
      </div>
    </>
  );
}

export function AcceptInvitation() {
  const t = useTranslations('auth');
  const token = useLinkToken();
  const me = useMe();
  const router = useRouter();
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();
  const accept = useMutation({
    mutationFn: identityApi.acceptInvitation,
    onSuccess: ({ storeId }) => {
      setActiveStoreId(storeId);
      void queryClient.invalidateQueries();
      router.replace('/');
    },
  });
  if (!token)
    return (
      <AuthCard title={t('invite.title')}>
        <FormAlert message={t('missingToken')} />
      </AuthCard>
    );
  return (
    <AuthCard title={t('invite.title')} description={t('invite.description')}>
      <FormAlert message={accept.isError ? errorMessage(accept.error) : null} />
      {me.isSuccess ? (
        <Button loading={accept.isPending} onClick={() => accept.mutate({ token })}>
          {t('invite.accept')}
        </Button>
      ) : (
        !me.isPending && <SignInFirst token={token} />
      )}
    </AuthCard>
  );
}
