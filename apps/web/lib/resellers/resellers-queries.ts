import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ResellerInput, ResellerProductInput } from '@trackecom/contracts';
import { resellersApi } from '../api/resellers-api';

const ROOT = ['resellers'] as const;

export const useResellers = () => useQuery({ queryKey: ROOT, queryFn: resellersApi.list });

export const useResellerCatalogue = () =>
  useQuery({ queryKey: [...ROOT, 'catalogue'], queryFn: resellersApi.catalogue });

export const useResellerOrders = (id: string) =>
  useQuery({ queryKey: [...ROOT, id, 'orders'], queryFn: () => resellersApi.orders(id) });

function useResellersMutation<TInput, TResult>(write: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: write,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ROOT }),
  });
}

export const useAddReseller = () =>
  useResellersMutation((body: ResellerInput) => resellersApi.create(body));

export const useUpdateReseller = (id: string) =>
  useResellersMutation((body: ResellerInput) => resellersApi.update(id, body));

export const usePayReseller = (id: string) => useResellersMutation(() => resellersApi.payout(id));

export const useAddResellerProduct = () =>
  useResellersMutation((body: ResellerProductInput) => resellersApi.addProduct(body));

export const useUpdateResellerProduct = (id: string) =>
  useResellersMutation((body: ResellerProductInput) => resellersApi.updateProduct(id, body));
