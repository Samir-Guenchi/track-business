'use client';

import type { DeliveryChoices, DeliveryRequestKind } from '@trackecom/contracts';
import { Input } from '@trackecom/ui';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '../../../i18n/routing';
import { formatDzd } from '../../../lib/format';

export interface ChoiceValues {
  readonly date: string;
  readonly time: string;
  readonly address: string;
  readonly landmark: string;
}

interface ChoiceFieldsProps {
  readonly kind: DeliveryRequestKind;
  readonly choices: DeliveryChoices;
  readonly values: ChoiceValues;
  readonly onChange: (next: Partial<ChoiceValues>) => void;
}

function StopDeskPrice({ delta }: { readonly delta: number | null }) {
  const t = useTranslations('deliveryChoices.stopDesk');
  const locale = useLocale() as Locale;
  if (delta === null) return <p className="text-sm">{t('priceUnknown')}</p>;
  if (delta === 0) return <p className="text-sm">{t('samePrice')}</p>;
  const amount = formatDzd(Math.abs(delta), locale);
  return <p className="text-sm font-medium">{t(delta < 0 ? 'cheaper' : 'dearer', { amount })}</p>;
}

function AddressFields({ values, onChange }: Omit<ChoiceFieldsProps, 'kind' | 'choices'>) {
  const t = useTranslations('deliveryChoices.fields');
  return (
    <>
      <Input
        label={t('address')}
        value={values.address}
        minLength={5}
        maxLength={200}
        required
        onChange={(event) => onChange({ address: event.currentTarget.value })}
      />
      <Input
        label={t('landmark')}
        value={values.landmark}
        maxLength={160}
        onChange={(event) => onChange({ landmark: event.currentTarget.value })}
      />
    </>
  );
}

/** The inputs one choice needs; the stop-desk switch only shows its price change. */
export function ChoiceFields({ kind, choices, values, onChange }: ChoiceFieldsProps) {
  const t = useTranslations('deliveryChoices.fields');
  if (kind === 'switch_stopdesk') return <StopDeskPrice delta={choices.stopDeskFeeDelta} />;
  if (kind === 'fix_address') return <AddressFields values={values} onChange={onChange} />;
  if (kind === 'call_after') {
    return (
      <Input
        type="time"
        label={t('time')}
        value={values.time}
        required
        onChange={(event) => onChange({ time: event.currentTarget.value })}
      />
    );
  }
  return (
    <Input
      type="date"
      label={t('date')}
      value={values.date}
      min={choices.earliestDate}
      max={choices.latestDate}
      required
      onChange={(event) => onChange({ date: event.currentTarget.value })}
    />
  );
}
