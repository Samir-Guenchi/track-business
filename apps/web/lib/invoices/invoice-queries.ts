import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '../api/invoices-api';

const keyFor = (orderId: string) => ['invoices', orderId] as const;

export const useOrderInvoices = (orderId: string) =>
  useQuery({ queryKey: keyFor(orderId), queryFn: () => invoicesApi.forOrder(orderId) });

/** Issuing an invoice or a credit note refreshes the order's list. */
export function useIssueInvoice(orderId: string) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: keyFor(orderId) });
  return {
    invoice: useMutation({ mutationFn: () => invoicesApi.issue(orderId), onSuccess: refresh }),
    creditNote: useMutation({ mutationFn: invoicesApi.creditNote, onSuccess: refresh }),
  };
}
