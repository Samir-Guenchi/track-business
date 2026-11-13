import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateReturnBatchInput } from '@trackecom/contracts';
import { returnsApi } from '../api/returns-api';

export interface ExpectedFilters {
  readonly overdue: boolean;
  readonly carrier: string | undefined;
}

export const returnKeys = {
  all: ['returns'] as const,
  expected: (filters: ExpectedFilters) => ['returns', 'expected', filters] as const,
  summary: ['returns', 'summary'] as const,
  batches: ['returns', 'batches'] as const,
  batch: (id: string) => ['returns', 'batch', id] as const,
  carriers: ['carriers', 'available'] as const,
};

const pageQuery = (cursor: string | undefined, extra: Record<string, string> = {}) =>
  new URLSearchParams({ ...extra, ...(cursor ? { cursor } : {}) });

export function useExpectedReturns(filters: ExpectedFilters) {
  const extra = {
    ...(filters.overdue ? { overdue: 'true' } : {}),
    ...(filters.carrier ? { carrier: filters.carrier } : {}),
  };
  return useInfiniteQuery({
    queryKey: returnKeys.expected(filters),
    queryFn: ({ pageParam }) => returnsApi.expected(pageQuery(pageParam, extra)),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}

export function useReturnBatches() {
  return useInfiniteQuery({
    queryKey: returnKeys.batches,
    queryFn: ({ pageParam }) => returnsApi.batches(pageQuery(pageParam)),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}

export const useReturnSummary = () =>
  useQuery({ queryKey: returnKeys.summary, queryFn: returnsApi.summary });

export const useReturnBatch = (id: string) =>
  useQuery({ queryKey: returnKeys.batch(id), queryFn: () => returnsApi.batch(id) });

export const useCarriers = () =>
  useQuery({ queryKey: returnKeys.carriers, queryFn: returnsApi.carriers, staleTime: Infinity });

export function useReceiveReturns() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateReturnBatchInput) => returnsApi.receive(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: returnKeys.all }),
  });
}
