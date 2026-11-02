'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { getActiveStoreId, setActiveStoreId } from '../../lib/session/active-store';
import { sessionKeys, useMyStores } from '../../lib/session/session-queries';

/** Switching store refetches every query, since all data is scoped by `x-store-id`. */
export function StoreSwitcher() {
  const t = useTranslations('shell.store');
  const queryClient = useQueryClient();
  const stores = useMyStores(true).data?.items ?? [];
  const [storeId, setStoreId] = useState(getActiveStoreId() ?? '');

  function change(next: string): void {
    setActiveStoreId(next);
    setStoreId(next);
    void queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] !== sessionKeys.me[0],
    });
  }

  return (
    <Select value={storeId} onValueChange={change} disabled={stores.length < 2}>
      <SelectTrigger aria-label={t('label')} className="w-32 whitespace-nowrap sm:w-44">
        <SelectValue placeholder={t('placeholder')} />
      </SelectTrigger>
      <SelectContent>
        {stores.map(({ store }) => (
          <SelectItem key={store.id} value={store.id}>
            {store.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
