import { describe, expect, it } from 'vitest';
import { filtersFromParams, isOverdue, listQueryOf, paramsFromFilters } from './followup-filters';

describe('follow-up filters', () => {
  it('defaults to the open queue and ignores unknown values', () => {
    expect(filtersFromParams(new URLSearchParams('status=nope&reason=bad'))).toEqual({
      status: 'open',
      reason: undefined,
      overdue: false,
    });
  });

  it('round-trips through the URL', () => {
    const filters = { status: 'decided', reason: 'refused', overdue: false } as const;

    expect(filtersFromParams(paramsFromFilters(filters))).toEqual(filters);
  });

  it('only sends overdue for open items', () => {
    expect(listQueryOf({ status: 'open', overdue: true }).get('overdue')).toBe('true');
    expect(listQueryOf({ status: 'closed', overdue: true }).get('overdue')).toBeNull();
  });

  it('flags open items past their due time', () => {
    const now = new Date('2026-11-02T12:00:00Z');

    expect(isOverdue({ status: 'open', dueAt: '2026-11-02T11:00:00Z' }, now)).toBe(true);
    expect(isOverdue({ status: 'decided', dueAt: '2026-11-02T11:00:00Z' }, now)).toBe(false);
  });
});
