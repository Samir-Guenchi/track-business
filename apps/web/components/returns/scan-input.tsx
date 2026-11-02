'use client';

import { Button } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

/**
 * Barcode scanners type the number and press Enter, so Enter adds it and clears the field for
 * the next parcel. The field keeps focus so a courier's whole bag can be scanned in a row.
 */
export function ScanInput({ onScan }: { readonly onScan: (raw: string) => void }) {
  const t = useTranslations('returns.receive');
  const [value, setValue] = useState('');
  const add = () => {
    onScan(value);
    setValue('');
  };
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="return-scan" className="tk-field__label">
        {t('scanLabel')}
      </label>
      <div className="flex gap-2">
        <input
          id="return-scan"
          className="tk-input flex-1"
          dir="ltr"
          autoComplete="off"
          autoFocus
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            add();
          }}
        />
        <Button type="button" variant="secondary" onClick={add}>
          {t('add')}
        </Button>
      </div>
      <span className="text-xs text-muted">{t('scanHint')}</span>
    </div>
  );
}
