'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@trackecom/ui';
import { useLocale, useTranslations } from 'next-intl';
import { useWilayas, wilayaLabel } from '../../lib/geo/geo-queries';

const ALL = 'all';

interface WilayaFilterProps {
  readonly value: number | undefined;
  readonly onChange: (wilayaCode: number | undefined) => void;
}

export function WilayaFilter({ value, onChange }: WilayaFilterProps) {
  const t = useTranslations('orders');
  const locale = useLocale();
  const wilayas = useWilayas().data?.items ?? [];
  return (
    <Select
      value={value ? String(value) : ALL}
      onValueChange={(next) => onChange(next === ALL ? undefined : Number(next))}
    >
      <SelectTrigger aria-label={t('wilaya')} className="sm:w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{t('allWilayas')}</SelectItem>
        {wilayas.map((wilaya) => (
          <SelectItem key={wilaya.code} value={String(wilaya.code)}>
            {wilayaLabel(wilaya, locale)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
