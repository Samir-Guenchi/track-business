'use client';

import { Skeleton } from '@trackecom/ui';
import { useEffect, type ReactNode } from 'react';
import { ApiClientError } from '../../lib/api/api-client-error';
import { useMe } from '../../lib/session/session-queries';
import { usePathname, useRouter } from '../../i18n/navigation';

/** For pages that need a session but no store yet (onboarding). */
export function SignedInOnly({ children }: { readonly children: ReactNode }) {
  const me = useMe();
  const router = useRouter();
  const pathname = usePathname();
  const signedOut = me.error instanceof ApiClientError && me.error.status === 401;
  useEffect(() => {
    if (signedOut) router.replace({ pathname: '/login', query: { next: pathname } });
  }, [signedOut, router, pathname]);
  if (me.isSuccess) return children;
  return <Skeleton className="h-40 w-full max-w-md" />;
}
