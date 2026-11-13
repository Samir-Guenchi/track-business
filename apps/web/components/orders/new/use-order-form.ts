'use client';

import type { Order } from '@trackecom/contracts';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useRouter } from '../../../i18n/navigation';
import type { LiveRef } from '../../../lib/live/live-order';
import { useShippingQuote } from '../../../lib/orders/use-shipping-quote';
import { PHONE_INPUT_ID } from './customer-fields';
import { useCreateOrder } from './use-create-order';
import { useLivePrefill } from './use-live-prefill';
import { useOrderDraft } from './use-order-draft';

/** "open" goes to the new order; "next" clears the form for the next call. */
export type AfterSave = 'open' | 'next';

/** `live`: the form starts from a live-selling reservation (#199). */
export function useOrderForm(live: LiveRef | null = null) {
  const t = useTranslations('orders.new');
  const router = useRouter();
  const controls = useOrderDraft();
  const quote = useShippingQuote(controls.draft);
  const linkLive = useLivePrefill(live, controls);
  const { submit, recheck, errors, mutation } = useCreateOrder();
  const [saved, setSaved] = useState<string | null>(null);
  // Re-runs on edits only, not when new errors appear.
  useEffect(() => recheck(controls.draft, quote.fee), [controls.draft, quote.fee]);

  function onCreated(order: Order, after: AfterSave) {
    linkLive(order);
    if (after === 'open') return router.push(`/orders/${order.id}`);
    controls.reset();
    setSaved(t('saved', { ref: order.ref }));
    document.getElementById(PHONE_INPUT_ID)?.focus();
  }
  const save = (after: AfterSave) =>
    submit(controls.draft, quote.fee, (order) => onCreated(order, after));

  return { controls, quote, errors, mutation, saved, save };
}
