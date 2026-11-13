import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateLiveSession } from '@trackecom/contracts';
import { liveSessionsApi } from '../api/live-sessions-api';
import type { LiveRef } from './live-order';

const ROOT = ['live-sessions'] as const;

export const useLiveSessions = () =>
  useQuery({ queryKey: [...ROOT, 'list'], queryFn: liveSessionsApi.list });

export const useLiveSession = (id: string | undefined) =>
  useQuery({
    queryKey: [...ROOT, id],
    queryFn: () => liveSessionsApi.get(id ?? ''),
    enabled: id !== undefined,
  });

function useLiveMutation<T, R>(mutationFn: (input: T) => Promise<R>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ROOT }),
  });
}

export const useCreateLiveSession = () =>
  useLiveMutation((body: CreateLiveSession) => liveSessionsApi.create(body));

export const useAddLiveComments = (id: string) =>
  useLiveMutation((text: string) => liveSessionsApi.addComments(id, text));

export const useLinkLiveOrder = () =>
  useLiveMutation(({ ref, orderId }: { ref: LiveRef; orderId: string }) =>
    liveSessionsApi.linkOrder(ref, orderId),
  );
