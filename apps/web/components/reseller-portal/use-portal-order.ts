'use client';

import type { ResellerOrderCreated, ResellerProduct } from '@trackecom/contracts';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { sendPortalOrder } from '../../lib/resellers/portal-api';

export interface PortalDraft {
  readonly name: string;
  readonly phone: string;
  readonly wilayaCode: string;
  readonly communeId: string;
  readonly address: string;
  readonly productId: string;
  readonly quantity: string;
  readonly sellingPrice: string;
}

const EMPTY: PortalDraft = {
  name: '',
  phone: '',
  wilayaCode: '',
  communeId: '',
  address: '',
  productId: '',
  quantity: '1',
  sellingPrice: '',
};

const requestOf = (draft: PortalDraft) => ({
  customer: {
    name: draft.name,
    phone: draft.phone,
    wilayaCode: Number(draft.wilayaCode),
    communeId: Number(draft.communeId),
    address: draft.address,
  },
  items: [
    {
      productId: draft.productId,
      quantity: Number(draft.quantity),
      sellingPrice: Number(draft.sellingPrice),
    },
  ],
  deliveryType: 'home' as const,
});

/** The reseller's order form: one product per order, home delivery. */
export function usePortalOrder(code: string, catalogue: readonly ResellerProduct[]) {
  const router = useRouter();
  const [draft, setDraft] = useState<PortalDraft>(EMPTY);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<ResellerOrderCreated | null>(null);
  const product = catalogue.find((item) => item.id === draft.productId) ?? null;
  const patch = (change: Partial<PortalDraft>) =>
    setDraft((current) => ({ ...current, ...change }));
  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);
    const result = await sendPortalOrder(code, requestOf(draft));
    setSending(false);
    setError(result.ok ? null : result.code);
    if (!result.ok) return;
    setCreated(result.created);
    setDraft(EMPTY);
    router.refresh();
  };
  return { draft, patch, product, sending, error, created, onSubmit };
}
