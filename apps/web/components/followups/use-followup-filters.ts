'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { usePathname, useRouter } from '../../i18n/navigation';
import {
  type FollowupFilters,
  filtersFromParams,
  paramsFromFilters,
} from '../../lib/followups/followup-filters';

/** Filters live in the URL so reloads and shared links keep the view. */
export function useFollowupFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filters = useMemo(
    () => filtersFromParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const setFilters = (next: FollowupFilters) =>
    router.replace(`${pathname}?${paramsFromFilters(next).toString()}`, { scroll: false });
  return { filters, setFilters };
}
