'use client';

import type { StoreProfile } from '@trackecom/contracts';
import { Skeleton } from '@trackecom/ui';
import type { ReactNode } from 'react';
import { useStoreProfile } from '../../lib/stores/store-profile-queries';
import { FormAlert } from '../auth/form-alert';
import { useErrorMessage } from '../auth/use-error-message';

/** Waits for the saved profile so the form starts from what the store already said. */
export function ProfileLoader({
  children,
}: {
  readonly children: (profile: StoreProfile) => ReactNode;
}) {
  const profile = useStoreProfile();
  const errorMessage = useErrorMessage();
  if (profile.isPending) return <Skeleton className="h-96" />;
  if (profile.isError) return <FormAlert message={errorMessage(profile.error)} />;
  return children(profile.data);
}
