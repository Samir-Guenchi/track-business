'use client';

import type { ResellerOrder } from '@trackecom/contracts';
import { Badge } from '@trackecom/ui';
import { useFormatter, useTranslations } from 'next-intl';
import { MARGIN_BADGE } from '../../lib/resellers/reseller-view';

const cell = 'px-3 py-2 text-start align-top';
const COLUMNS = ['ref', 'customer', 'status', 'cod', 'margin', 'date'] as const;

/** A reseller's orders with their margin; shared by the supplier screen and the reseller portal. */
export function ResellerOrders({ items }: { readonly items: readonly ResellerOrder[] }) {
  const t = useTranslations('resellers.orders');
  if (items.length === 0) return <p className="text-sm text-muted">{t('empty')}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted">
            {COLUMNS.map((column) => (
              <th key={column} scope="col" className={cell}>
                {t(`columns.${column}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((order) => (
            <OrderRow key={order.orderId} order={order} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderRow({ order }: { readonly order: ResellerOrder }) {
  const t = useTranslations('resellers.orders');
  const format = useFormatter();
  return (
    <tr className="border-t border-border">
      <td className={cell} dir="ltr">
        {order.ref}
      </td>
      <td className={cell}>{order.customerName}</td>
      <td className={cell}>{t(`status.${order.status}`)}</td>
      <td className={cell}>{t('dinars', { amount: order.codAmount })}</td>
      <td className={cell}>
        <span className="flex flex-wrap items-center gap-2">
          {t('dinars', { amount: order.margin })}
          <Badge variant={MARGIN_BADGE[order.marginState]}>
            {t(`margin.${order.marginState}`)}
          </Badge>
        </span>
      </td>
      <td className={cell}>{format.dateTime(new Date(order.createdAt), { dateStyle: 'short' })}</td>
    </tr>
  );
}
