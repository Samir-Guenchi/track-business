import { isStatusTab, statusFilterOf, type StatusTab } from './status-tabs';

/** What the orders screen filters on; lives in the URL so a view can be shared or bookmarked. */
export interface OrderFilters {
  readonly tab: StatusTab;
  readonly q?: string;
  readonly wilayaCode?: number;
}

export function filtersFromParams(params: URLSearchParams): OrderFilters {
  const tab = params.get('tab');
  const q = params.get('q')?.trim();
  const wilayaCode = Number(params.get('wilaya'));
  return {
    tab: isStatusTab(tab) ? tab : 'to_confirm',
    ...(q && q.length >= 2 ? { q } : {}),
    ...(Number.isInteger(wilayaCode) && wilayaCode > 0 ? { wilayaCode } : {}),
  };
}

export function paramsFromFilters(filters: OrderFilters): URLSearchParams {
  const params = new URLSearchParams({ tab: filters.tab });
  if (filters.q) params.set('q', filters.q);
  if (filters.wilayaCode) params.set('wilaya', String(filters.wilayaCode));
  return params;
}

/** The `GET /orders` query string for these filters and page. */
export function listQueryOf(filters: OrderFilters, cursor?: string): URLSearchParams {
  const query = new URLSearchParams({ limit: '50' });
  const status = statusFilterOf(filters.tab);
  if (status) query.set('status', status);
  if (filters.q) query.set('q', filters.q);
  if (filters.wilayaCode) query.set('wilayaCode', String(filters.wilayaCode));
  if (cursor) query.set('cursor', cursor);
  return query;
}

function compact(tab: OrderFilters['tab'], q?: string, wilayaCode?: number): OrderFilters {
  return { tab, ...(q ? { q } : {}), ...(wilayaCode ? { wilayaCode } : {}) };
}

/** Same filters with a new search; under two characters means no search. */
export function withSearch(filters: OrderFilters, q: string): OrderFilters {
  const trimmed = q.trim();
  return compact(filters.tab, trimmed.length >= 2 ? trimmed : undefined, filters.wilayaCode);
}

export function withWilaya(filters: OrderFilters, wilayaCode: number | undefined): OrderFilters {
  return compact(filters.tab, filters.q, wilayaCode);
}
