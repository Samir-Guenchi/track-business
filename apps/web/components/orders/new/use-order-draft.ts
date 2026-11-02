'use client';

import { useCallback, useState } from 'react';
import {
  type DraftItem,
  emptyDraft,
  newItem,
  type OrderDraft,
} from '../../../lib/orders/order-draft';

type ItemChanges = Partial<Omit<DraftItem, 'key'>>;

/** The form's state with small, named updates so each field stays a one-liner. */
export function useOrderDraft() {
  const [draft, setDraft] = useState<OrderDraft>(emptyDraft);
  const patch = useCallback(
    (changes: Partial<OrderDraft>) => setDraft((current) => ({ ...current, ...changes })),
    [],
  );
  const changeItem = useCallback((key: string, changes: ItemChanges) => {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item) => (item.key === key ? { ...item, ...changes } : item)),
    }));
  }, []);
  const addItem = useCallback(() => {
    setDraft((current) => ({ ...current, items: [...current.items, newItem()] }));
  }, []);
  const removeItem = useCallback((key: string) => {
    setDraft((current) => ({
      ...current,
      items: current.items.filter((item) => item.key !== key),
    }));
  }, []);
  const reset = useCallback(() => setDraft(emptyDraft()), []);
  return { draft, setDraft, patch, changeItem, addItem, removeItem, reset };
}

export type DraftControls = ReturnType<typeof useOrderDraft>;
