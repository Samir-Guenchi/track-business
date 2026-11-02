'use client';

import type { Order } from '@trackecom/contracts';
import { Button, DataTable, EmptyState, Skeleton } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import type { useOrdersList } from '../../lib/orders/order-queries';
import { useOrderColumns } from './order-columns';
import { useOrderShortcuts } from './use-order-shortcuts';

interface OrdersResultsProps {
  readonly list: ReturnType<typeof useOrdersList>;
  readonly orders: readonly Order[];
  readonly onSelectionChange: (ids: readonly string[]) => void;
}

export function OrdersResults({ list, orders, onSelectionChange }: OrdersResultsProps) {
  const t = useTranslations('orders');
  const columns = useOrderColumns();
  const activeRowId = useOrderShortcuts(orders);
  const refOf = (id: string) => orders.find((order) => order.id === id)?.ref ?? id;
  if (list.isPending) return <Skeleton className="h-64" />;
  if (list.isSuccess && orders.length === 0) {
    return <EmptyState title={t('empty.title')} description={t('empty.description')} />;
  }
  return (
    <>
      <DataTable
        rows={orders}
        columns={columns}
        getRowId={(order) => order.id}
        ariaLabel={t('tableLabel')}
        selectAllLabel={t('selectAll')}
        selectionLabel={(id) => t('selectRow', { ref: refOf(id) })}
        onSelectionChange={onSelectionChange}
        activeRowId={activeRowId}
      />
      {list.hasNextPage && (
        <Button
          variant="secondary"
          onClick={() => void list.fetchNextPage()}
          loading={list.isFetchingNextPage}
        >
          {t('actions.more')}
        </Button>
      )}
      <p className="text-xs text-muted">{t('shortcuts')}</p>
    </>
  );
}
