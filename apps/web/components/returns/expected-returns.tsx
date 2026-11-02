'use client';

import { EmptyState, Skeleton } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { type ExpectedFilters, useExpectedReturns } from '../../lib/returns/returns-queries';
import { useErrorMessage } from '../auth/use-error-message';
import { FormAlert } from '../auth/form-alert';
import { CarrierSelect } from './carrier-select';
import { ExpectedTable } from './expected-table';
import { MoreButton } from './more-button';

/** Returns announced by the carriers and not scanned in yet, oldest first. */
export function ExpectedReturns() {
  const t = useTranslations('returns');
  const [filters, setFilters] = useState<ExpectedFilters>({ overdue: false, carrier: undefined });
  const list = useExpectedReturns(filters);
  const errorMessage = useErrorMessage();
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <CarrierSelect
          value={filters.carrier}
          allLabel={t('allCarriers')}
          onChange={(carrier) => setFilters({ ...filters, carrier })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.overdue}
            onChange={(event) => setFilters({ ...filters, overdue: event.currentTarget.checked })}
          />
          {t('overdueOnly')}
        </label>
      </div>
      <FormAlert message={list.error ? errorMessage(list.error) : null} />
      {list.isPending && <Skeleton className="h-40" />}
      {list.isSuccess && items.length === 0 && (
        <EmptyState title={t('tabs.expected')} description={t('empty')} />
      )}
      {items.length > 0 && <ExpectedTable items={items} />}
      <MoreButton list={list} label={t('more')} />
    </div>
  );
}
