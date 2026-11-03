'use client';

import type { DeliveryType, StorePricesResponse } from '@trackecom/contracts';
import { useState } from 'react';
import {
  type PriceGridDraft,
  type PriceRow,
  draftOf,
  fillEmpty,
  priceChanges,
} from '../../lib/pricing/price-grid';
import { useUpdateStorePrices } from '../../lib/pricing/pricing-queries';
import { useErrorMessage } from '../auth/use-error-message';

export interface PriceGridState {
  readonly draft: PriceGridDraft;
  readonly patchRow: (wilayaCode: number, change: Partial<PriceRow>) => void;
  readonly setThreshold: (text: string) => void;
  readonly fill: (type: DeliveryType, price: number) => void;
  readonly save: () => Promise<boolean>;
  readonly isPending: boolean;
  readonly apiError: string | null;
}

/** The edited grid against the saved one; saving sends only what changed. */
export function usePriceGrid(saved: StorePricesResponse): PriceGridState {
  const [draft, setDraft] = useState(() => draftOf(saved));
  const mutation = useUpdateStorePrices();
  const toMessage = useErrorMessage();
  const save = async () => {
    const change = priceChanges(draft, draftOf(saved));
    if (change === null) return true;
    return (await mutation.mutateAsync(change).catch(() => null)) !== null;
  };
  return {
    draft,
    patchRow: (wilayaCode, change) =>
      setDraft((current) => ({
        ...current,
        rows: current.rows.map((row) =>
          row.wilayaCode === wilayaCode ? { ...row, ...change } : row,
        ),
      })),
    setThreshold: (freeShippingFrom) => setDraft((current) => ({ ...current, freeShippingFrom })),
    fill: (type, price) => setDraft((current) => fillEmpty(current, type, price)),
    save,
    isPending: mutation.isPending,
    apiError: mutation.error ? toMessage(mutation.error) : null,
  };
}
