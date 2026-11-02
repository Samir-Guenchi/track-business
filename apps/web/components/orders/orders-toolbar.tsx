'use client';

import { Input } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { type OrderFilters, withSearch, withWilaya } from '../../lib/orders/order-filters';
import { WilayaFilter } from './wilaya-filter';

const SEARCH_DELAY_MS = 300;

interface OrdersToolbarProps {
  readonly filters: OrderFilters;
  readonly onChange: (filters: OrderFilters) => void;
}

export function OrdersToolbar({ filters, onChange }: OrdersToolbarProps) {
  const t = useTranslations('orders');
  const [search, setSearch] = useState(filters.q ?? '');
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = withSearch(filters, search);
      if (next.q !== filters.q) onChange(next);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search, filters, onChange]);
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <Input
        type="search"
        aria-label={t('search')}
        placeholder={t('search')}
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        className="sm:w-80"
      />
      <WilayaFilter
        value={filters.wilayaCode}
        onChange={(code) => onChange(withWilaya(filters, code))}
      />
    </div>
  );
}
