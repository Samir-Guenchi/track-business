import { describe, expect, it } from 'vitest';
import {
  filtersFromParams,
  listQueryOf,
  paramsFromFilters,
  withSearch,
  withWilaya,
} from './order-filters';

describe('order filters', () => {
  it('defaults to the confirmation tab and ignores bad values', () => {
    expect(filtersFromParams(new URLSearchParams('tab=nope&q=a&wilaya=x'))).toEqual({
      tab: 'to_confirm',
    });
  });

  it('round-trips through the URL', () => {
    const filters = { tab: 'on_the_way', q: '0550', wilayaCode: 16 } as const;
    expect(filtersFromParams(paramsFromFilters(filters))).toEqual(filters);
  });

  it('builds the API query with the statuses of the tab', () => {
    const query = listQueryOf({ tab: 'returns', wilayaCode: 31 }, 'c1');
    expect(Object.fromEntries(query)).toEqual({
      limit: '50',
      status: 'returning,returned',
      wilayaCode: '31',
      cursor: 'c1',
    });
  });

  it('sends no status for the "all" tab', () => {
    expect(listQueryOf({ tab: 'all' }).has('status')).toBe(false);
  });

  it('drops a search shorter than two characters and a cleared wilaya', () => {
    const filters = { tab: 'all', q: '0550', wilayaCode: 16 } as const;
    expect(withSearch(filters, ' a ')).toEqual({ tab: 'all', wilayaCode: 16 });
    expect(withWilaya(filters, undefined)).toEqual({ tab: 'all', q: '0550' });
  });
});
