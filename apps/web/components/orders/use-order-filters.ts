'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import {
  filtersFromParams,
  paramsFromFilters,
  type OrderFilters,
} from '../../lib/orders/order-filters';
import { usePathname, useRouter } from '../../i18n/navigation';

/** Filters live in the URL so the back button, reloads and shared links keep the view. */
export function useOrderFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filters = useMemo(
    () => filtersFromParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const setFilters = (next: OrderFilters) =>
    router.replace(`${pathname}?${paramsFromFilters(next).toString()}`, { scroll: false });
  return { filters, setFilters };
}
