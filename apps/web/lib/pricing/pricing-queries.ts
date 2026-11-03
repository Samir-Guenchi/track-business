import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pricingApi } from '../api/pricing-api';

const storePricesKey = ['pricing', 'store-prices'] as const;

export function useStorePrices() {
  return useQuery({ queryKey: storePricesKey, queryFn: pricingApi.storePrices });
}

/** Saving changes the live quotes too, so every pricing query is refreshed. */
export function useUpdateStorePrices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pricingApi.updateStorePrices,
    onSuccess: (prices) => {
      queryClient.setQueryData(storePricesKey, prices);
      return queryClient.invalidateQueries({ queryKey: ['pricing', 'quote'] });
    },
  });
}
