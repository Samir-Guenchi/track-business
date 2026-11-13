'use client';

import type { ResellerOrder } from '@trackecom/contracts';
import { Badge } from '@trackecom/ui';
import { useFormatter, useTranslations } from 'next-intl';
import { MARGIN_BADGE } from '../../lib/resellers/reseller-view';

const COLUMNS = ['ref', 'customer', 'status', 'cod', 'margin', 'date'] as const;

function OrderRow({ order }: { readonly order: ResellerOrder }) {
  const t = useTranslations('resellers.orders');
  const format = useFormatter();
  return (
    <tr>
      <td data-label={t('columns.ref')}>
        <span dir="ltr" className="studio-table__muted">
          {order.ref}
        </span>
      </td>
      <td data-label={t('columns.customer')}>{order.customerName}</td>
      <td data-label={t('columns.status')}>{t(`status.${order.status}`)}</td>
      <td data-label={t('columns.cod')} className="studio-num">
        {t('dinars', { amount: order.codAmount })}
      </td>
      <td data-label={t('columns.margin')}>
        <span className="studio-margin-cell">
          <span className="studio-num">{t('dinars', { amount: order.margin })}</span>
          <Badge variant={MARGIN_BADGE[order.marginState]}>
            {t(`margin.${order.marginState}`)}
          </Badge>
        </span>
      </td>
      <td data-label={t('columns.date')} className="studio-table__muted">
        {format.dateTime(new Date(order.createdAt), { dateStyle: 'short' })}
      </td>
    </tr>
  );
}

/** A reseller's orders with their margin; shared by the supplier screen and the reseller portal. */
export function ResellerOrders({ items }: { readonly items: readonly ResellerOrder[] }) {
  const t = useTranslations('resellers.orders');
  if (items.length === 0) return <p className="studio-empty-line">{t('empty')}</p>;
  return (
    <div className="studio-table-wrap">
      <table className="studio-table">
        <thead>
          <tr>
            {COLUMNS.map((column) => (
              <th key={column} scope="col">
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
