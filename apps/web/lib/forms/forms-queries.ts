import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateOrderFormInput } from '@trackecom/contracts';
import { formsApi } from '../api/forms-api';

const KEY = ['order-forms'] as const;

export const useOrderForms = () => useQuery({ queryKey: KEY, queryFn: formsApi.list });

export interface SaveFormInput {
  readonly id: string | null;
  readonly body: CreateOrderFormInput;
  readonly enabled: boolean;
}

/** Creates a form, or replaces one (also used to switch it on or off). */
export function useSaveOrderForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body, enabled }: SaveFormInput) =>
      id ? formsApi.update(id, { ...body, enabled }) : formsApi.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
