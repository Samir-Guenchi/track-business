'use client';

import { useEffect } from 'react';
import { ApiClientError } from '../../lib/api/api-client-error';
import { getActiveStoreId, setActiveStoreId } from '../../lib/session/active-store';
import { pickActiveStore } from '../../lib/session/pick-active-store';
import { useMe, useMyStores } from '../../lib/session/session-queries';
import { usePathname, useRouter } from '../../i18n/navigation';

export type GateState = 'loading' | 'ready' | 'error';

const isSignedOut = (error: unknown) => error instanceof ApiClientError && error.status === 401;

/** Signed in and inside a store, or on the way to log in / onboarding. */
export function useSessionGate(): { state: GateState; retry: () => void } {
  const router = useRouter();
  const pathname = usePathname();
  const me = useMe();
  const stores = useMyStores(me.isSuccess);
  const storeItems = stores.data?.items;
  const signedOut = me.isError && isSignedOut(me.error);

  useEffect(() => {
    if (signedOut) router.replace({ pathname: '/login', query: { next: pathname } });
  }, [signedOut, router, pathname]);

  useEffect(() => {
    if (!storeItems) return;
    const storeId = pickActiveStore(getActiveStoreId(), storeItems);
    if (storeId === null) router.replace('/onboarding');
    else setActiveStoreId(storeId);
  }, [storeItems, router]);

  const failed = (me.isError && !signedOut) || stores.isError;
  const ready = storeItems !== undefined && storeItems.length > 0;
  return {
    state: failed ? 'error' : ready ? 'ready' : 'loading',
    retry: () => void (me.isError ? me.refetch() : stores.refetch()),
  };
}
