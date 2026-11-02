'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { useCarriers } from '../../lib/returns/returns-queries';

const ALL = 'all';

interface CarrierSelectProps {
  readonly value: string | undefined;
  readonly onChange: (carrier: string | undefined) => void;
  /** Shown as the "no filter" choice; left out, a carrier must be picked. */
  readonly allLabel?: string;
  readonly id?: string;
}

export function CarrierSelect({ value, onChange, allLabel, id }: CarrierSelectProps) {
  const t = useTranslations('returns.receive');
  const carriers = useCarriers().data?.items ?? [];
  const choose = (next: string) => onChange(next === ALL ? undefined : next);
  return (
    <Select value={value ?? (allLabel ? ALL : '')} onValueChange={choose}>
      <SelectTrigger id={id} aria-label={t('carrier')} className="w-56">
        <SelectValue placeholder={t('chooseCarrier')} />
      </SelectTrigger>
      <SelectContent>
        {allLabel && <SelectItem value={ALL}>{allLabel}</SelectItem>}
        {carriers.map((carrier) => (
          <SelectItem key={carrier.code} value={carrier.code}>
            {carrier.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
