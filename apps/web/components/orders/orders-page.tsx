'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useOrdersList } from '../../lib/orders/order-queries';
import { FormAlert } from '../auth/form-alert';
import { useErrorMessage } from '../auth/use-error-message';
import { BulkBar } from './bulk-bar';
import { OrdersResults } from './orders-results';
import { OrdersTabs } from './orders-tabs';
import { OrdersToolbar } from './orders-toolbar';
import { useOrderFilters } from './use-order-filters';

export function OrdersPage() {
  const t = useTranslations('orders');
  const { filters, setFilters } = useOrderFilters();
  const list = useOrdersList(filters);
  const orders = list.data?.pages.flatMap((page) => page.items) ?? [];
  const errorMessage = useErrorMessage();
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <OrdersTabs value={filters.tab} onChange={(tab) => setFilters({ ...filters, tab })} />
      <OrdersToolbar filters={filters} onChange={setFilters} />
      <BulkBar selectedIds={selectedIds} onDone={setFeedback} />
      <FormAlert tone="success" message={feedback} />
      <FormAlert message={list.isError ? errorMessage(list.error) : null} />
      <OrdersResults list={list} orders={orders} onSelectionChange={setSelectedIds} />
    </section>
  );
}
