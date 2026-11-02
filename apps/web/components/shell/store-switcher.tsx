'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@trackecom/ui';
import { useTranslations } from 'next-intl';

// TODO(#18): list the member's stores from identity and switch the active store.
export function StoreSwitcher() {
  const t = useTranslations('shell.store');
  return (
    <Select value="current" disabled>
      <SelectTrigger aria-label={t('label')} className="w-32 whitespace-nowrap sm:w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="current">{t('placeholder')}</SelectItem>
      </SelectContent>
    </Select>
  );
}
