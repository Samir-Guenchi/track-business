'use client';

import type { Order } from '@trackecom/contracts';
import { useEffect, useState } from 'react';
import { useChangeStatus } from '../../lib/orders/order-queries';
import {
  moveIndex,
  shortcutFor,
  targetStatus,
  type ShortcutAction,
} from '../../lib/orders/shortcuts';
import { useRouter } from '../../i18n/navigation';

/** j/k to move, Enter to open, c to confirm and x to cancel the highlighted order. */
export function useOrderShortcuts(orders: readonly Order[]): string | undefined {
  const [activeIndex, setActiveIndex] = useState(-1);
  const router = useRouter();
  const changeStatus = useChangeStatus();
  const active = orders[activeIndex];

  useEffect(() => {
    const run = (action: ShortcutAction) => {
      if (action === 'next' || action === 'previous')
        return setActiveIndex((index) => moveIndex(index, action, orders.length));
      if (!active) return;
      if (action === 'open') return router.push(`/orders/${active.id}`);
      const status = targetStatus(action, active.status);
      if (status) changeStatus.mutate({ id: active.id, status });
    };
    const onKeyDown = (event: KeyboardEvent) => {
      // KeyboardEvent fields are getters, so they are passed one by one, not spread.
      const action = shortcutFor({
        key: event.key,
        target: event.target instanceof HTMLElement ? event.target : null,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey,
      });
      if (!action) return;
      event.preventDefault();
      run(action);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [orders.length, active, router, changeStatus]);

  return active?.id;
}
