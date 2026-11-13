'use client';

import type { Order } from '@trackecom/contracts';
import { useEffect, useRef } from 'react';
import { type LiveRef, liveDraft } from '../../../lib/live/live-order';
import { useLinkLiveOrder, useLiveSession } from '../../../lib/live/live-queries';
import type { DraftControls } from './use-order-draft';

/**
 * Fills the form once from a live reservation (#199) and, after saving, links the new order
 * back to the reservation so the live screen shows it as ordered.
 */
export function useLivePrefill(live: LiveRef | null, controls: DraftControls) {
  const session = useLiveSession(live?.sessionId);
  const link = useLinkLiveOrder();
  const filled = useRef(false);
  const { setDraft } = controls;
  useEffect(() => {
    const reservation = session.data?.reservations.find((r) => r.id === live?.reservationId);
    if (filled.current || !session.data || !reservation) return;
    filled.current = true;
    const data = session.data;
    setDraft((draft) => liveDraft(draft, data, reservation));
  }, [session.data, live?.reservationId, setDraft]);
  return (order: Order) => {
    if (live) link.mutate({ ref: live, orderId: order.id });
  };
}
