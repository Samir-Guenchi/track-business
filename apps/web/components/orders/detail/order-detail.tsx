'use client';

import { Skeleton, StatusBadge } from '@trackecom/ui';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useOrder } from '../../../lib/orders/order-queries';
import { Link } from '../../../i18n/navigation';
import { FormAlert } from '../../auth/form-alert';
import { useErrorMessage } from '../../auth/use-error-message';
import { CustomerCard } from './customer-card';
import { HistoryCard } from './history-card';
import { ItemsCard } from './items-card';
import { StatusActions } from './status-actions';

export function OrderDetail({ orderId }: { readonly orderId: string }) {
  const t = useTranslations('orders');
  const order = useOrder(orderId);
  const errorMessage = useErrorMessage();
  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-4">
      <Link href="/orders" className="flex items-center gap-1 text-sm text-tape underline">
        <ArrowLeft size={16} aria-hidden className="rtl:-scale-x-100" />
        {t('back')}
      </Link>
      <FormAlert message={order.isError ? errorMessage(order.error) : null} />
      {order.isPending && <Skeleton className="h-64" />}
      {order.data && (
        <>
          <header className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold" dir="ltr">
              {order.data.ref}
            </h1>
            <StatusBadge status={order.data.status}>{t(`status.${order.data.status}`)}</StatusBadge>
          </header>
          <StatusActions order={order.data} />
          <div className="grid gap-4 lg:grid-cols-2">
            <CustomerCard order={order.data} />
            <ItemsCard order={order.data} />
          </div>
          <HistoryCard orderId={orderId} />
        </>
      )}
    </section>
  );
}
