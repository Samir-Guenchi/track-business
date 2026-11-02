'use client';

import { type Order, ORDER_TRANSITIONS, type OrderStatus } from '@trackecom/contracts';
import { Button } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { useChangeStatus } from '../../../lib/orders/order-queries';
import { FormAlert } from '../../auth/form-alert';
import { useErrorMessage } from '../../auth/use-error-message';

// Postponing needs a date (#29 adds the picker); shipping moves come from the carrier.
const MANUAL_TARGETS: ReadonlySet<OrderStatus> = new Set([
  'to_confirm',
  'confirmed',
  'unreachable',
  'cancelled',
  'ready_to_ship',
]);

export function StatusActions({ order }: { readonly order: Order }) {
  const t = useTranslations('orders');
  const changeStatus = useChangeStatus();
  const errorMessage = useErrorMessage();
  const targets = ORDER_TRANSITIONS[order.status].filter((status) => MANUAL_TARGETS.has(status));
  if (targets.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <FormAlert message={changeStatus.isError ? errorMessage(changeStatus.error) : null} />
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('moveTo')}>
        {targets.map((status) => (
          <Button
            key={status}
            size="sm"
            variant={
              status === 'cancelled' ? 'danger' : status === 'confirmed' ? 'primary' : 'secondary'
            }
            disabled={changeStatus.isPending}
            onClick={() => changeStatus.mutate({ id: order.id, status })}
          >
            {t(`status.${status}`)}
          </Button>
        ))}
      </div>
    </div>
  );
}
