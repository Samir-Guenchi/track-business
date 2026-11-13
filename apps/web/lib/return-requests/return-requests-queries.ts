import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DecideReturnRequest, ReturnRequestState } from '@trackecom/contracts';
import { returnRequestsApi } from '../api/return-requests-api';

const ROOT = ['return-requests'] as const;

export const useReturnRequests = (state?: ReturnRequestState) =>
  useQuery({ queryKey: [...ROOT, state ?? 'all'], queryFn: () => returnRequestsApi.list(state) });

export function useDecideReturnRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: DecideReturnRequest }) =>
      returnRequestsApi.decide(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ROOT }),
  });
}
