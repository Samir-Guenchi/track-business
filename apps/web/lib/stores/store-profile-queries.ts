import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpdateStoreProfileRequest } from '@trackecom/contracts';
import { identityApi } from '../api/identity-api';

const KEY = ['store-profile'] as const;

export const useStoreProfile = () => useQuery({ queryKey: KEY, queryFn: identityApi.storeProfile });

export function useUpdateStoreProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateStoreProfileRequest) => identityApi.updateStoreProfile(body),
    onSuccess: (profile) => queryClient.setQueryData(KEY, profile),
  });
}
