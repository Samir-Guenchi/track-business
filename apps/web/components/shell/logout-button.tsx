'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@trackecom/ui';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { identityApi } from '../../lib/api/identity-api';
import { setActiveStoreId } from '../../lib/session/active-store';
import { useRouter } from '../../i18n/navigation';

export function LogoutButton() {
  const t = useTranslations('auth');
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useMutation({
    mutationFn: identityApi.logout,
    // Leave the app even if the call fails: the cookies expire on their own.
    onSettled: () => {
      setActiveStoreId(null);
      queryClient.clear();
      router.replace('/login');
    },
  });
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => logout.mutate()}
      loading={logout.isPending}
      aria-label={t('logout')}
      title={t('logout')}
    >
      <LogOut size={18} aria-hidden className="rtl:-scale-x-100" />
    </Button>
  );
}
