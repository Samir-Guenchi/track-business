'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateOrderRequestSchema, type Order } from '@trackecom/contracts';
import { useState } from 'react';
import { ordersApi } from '../../../lib/api/orders-api';
import { invalidPaths } from '../../../lib/forms/invalid-paths';
import { type DraftField, draftErrors } from '../../../lib/orders/draft-errors';
import { type OrderDraft, toCreateRequest } from '../../../lib/orders/order-draft';
import { orderKeys } from '../../../lib/orders/order-queries';

const NO_ERRORS: ReadonlySet<DraftField> = new Set();

function validate(draft: OrderDraft, quotedFee: number | null) {
  const parsed = CreateOrderRequestSchema.safeParse(toCreateRequest(draft, quotedFee));
  if (parsed.success) return { body: parsed.data, fields: NO_ERRORS };
  return { body: undefined, fields: draftErrors(invalidPaths(parsed.error), draft) };
}

/** Checks the draft with the API's own schema, then creates the order and refreshes the lists. */
export function useCreateOrder() {
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState(NO_ERRORS);
  const mutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orderKeys.all }),
  });

  function submit(draft: OrderDraft, quotedFee: number | null, onCreated: (order: Order) => void) {
    const { body, fields } = validate(draft, quotedFee);
    setErrors(fields);
    if (body) mutation.mutate(body, { onSuccess: onCreated });
  }
  /** After a failed save, red fields turn back to normal as soon as they are fixed. */
  function recheck(draft: OrderDraft, quotedFee: number | null) {
    if (errors.size > 0) setErrors(validate(draft, quotedFee).fields);
  }

  return { submit, recheck, errors, mutation };
}
