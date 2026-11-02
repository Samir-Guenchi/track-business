import { useQuery } from '@tanstack/react-query';
import { identityApi } from '../api/identity-api';

export const sessionKeys = {
  me: ['session', 'me'] as const,
  stores: ['session', 'stores'] as const,
};

export function useMe() {
  return useQuery({ queryKey: sessionKeys.me, queryFn: identityApi.me, retry: false });
}

export function useMyStores(isEnabled: boolean) {
  return useQuery({
    queryKey: sessionKeys.stores,
    queryFn: identityApi.myStores,
    enabled: isEnabled,
  });
}
