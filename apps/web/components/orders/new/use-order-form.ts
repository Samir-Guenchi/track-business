'use client';

import type { Order } from '@trackecom/contracts';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useRouter } from '../../../i18n/navigation';
import { useShippingQuote } from '../../../lib/orders/use-shipping-quote';
import { PHONE_INPUT_ID } from './customer-fields';
import { useCreateOrder } from './use-create-order';
import { useOrderDraft } from './use-order-draft';

/** "open" goes to the new order; "next" clears the form for the next call. */
export type AfterSave = 'open' | 'next';

export function useOrderForm() {
  const t = useTranslations('orders.new');
  const router = useRouter();
  const controls = useOrderDraft();
  const quote = useShippingQuote(controls.draft);
  const { submit, recheck, errors, mutation } = useCreateOrder();
  const [saved, setSaved] = useState<string | null>(null);
  // Re-runs on edits only, not when new errors appear.
  useEffect(() => recheck(controls.draft, quote.fee), [controls.draft, quote.fee]);

  function onCreated(order: Order, after: AfterSave) {
    if (after === 'open') return router.push(`/orders/${order.id}`);
    controls.reset();
    setSaved(t('saved', { ref: order.ref }));
    document.getElementById(PHONE_INPUT_ID)?.focus();
  }
  const save = (after: AfterSave) =>
    submit(controls.draft, quote.fee, (order) => onCreated(order, after));

  return { controls, quote, errors, mutation, saved, save };
}
