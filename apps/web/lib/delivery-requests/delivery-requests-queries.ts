import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpdateDeliveryRequest } from '@trackecom/contracts';
import { type DeliveryRequestFilter, deliveryRequestsApi } from '../api/delivery-requests-api';

const ROOT = ['delivery-requests'] as const;

export const useDeliveryRequests = (filter: DeliveryRequestFilter) =>
  useQuery({ queryKey: [...ROOT, filter], queryFn: () => deliveryRequestsApi.list(filter) });

/** Marks a request as passed to the carrier or dismissed; every list refreshes. */
export function useAnswerDeliveryRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, state }: { id: string } & UpdateDeliveryRequest) =>
      deliveryRequestsApi.update(id, { state }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ROOT }),
  });
}
