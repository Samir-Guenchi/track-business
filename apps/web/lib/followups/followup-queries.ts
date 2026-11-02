import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DecideFollowupRequest } from '@trackecom/contracts';
import { followupsApi } from '../api/followups-api';
import { type FollowupFilters, listQueryOf } from './followup-filters';

export const followupKeys = {
  all: ['followups'] as const,
  list: (filters: FollowupFilters) => ['followups', 'list', filters] as const,
  metrics: ['followups', 'metrics'] as const,
};

export function useFollowups(filters: FollowupFilters) {
  return useInfiniteQuery({
    queryKey: followupKeys.list(filters),
    queryFn: ({ pageParam }) => followupsApi.list(listQueryOf(filters, pageParam)),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}

export function useFollowupMetrics() {
  return useQuery({ queryKey: followupKeys.metrics, queryFn: followupsApi.metrics });
}

export function useDecideFollowup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: DecideFollowupRequest }) =>
      followupsApi.decide(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: followupKeys.all }),
  });
}
