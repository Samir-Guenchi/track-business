'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { safeNextPath } from '../../lib/navigation/safe-next';
import { useRouter } from '../../i18n/navigation';

/** After log in or sign up: forget the previous user's cached data and go to `?next=`. */
export function useSignedInRedirect(fallback = '/') {
  const router = useRouter();
  const queryClient = useQueryClient();
  const next = safeNextPath(useSearchParams().get('next'), fallback);
  return {
    next,
    onSignedIn: () => {
      queryClient.clear();
      router.replace(next);
    },
  };
}
