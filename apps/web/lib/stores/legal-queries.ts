import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpdateStoreLegalProfileRequest } from '@trackecom/contracts';
import { identityApi } from '../api/identity-api';

const KEY = ['store-legal'] as const;

export const useLegalProfile = () => useQuery({ queryKey: KEY, queryFn: identityApi.legalProfile });

export function useUpdateLegalProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateStoreLegalProfileRequest) => identityApi.updateLegalProfile(body),
    onSuccess: (profile) => queryClient.setQueryData(KEY, profile),
  });
}
