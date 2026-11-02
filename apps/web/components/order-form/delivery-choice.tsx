'use client';

import type { PublicOrderForm } from '@trackecom/contracts';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '../../i18n/routing';
import { formatDzd } from '../../lib/format';
import { type DeliveryOption, deliveryOptions } from '../../lib/forms/form-total';
import type { CodForm } from './use-cod-form';

interface Props {
  readonly form: PublicOrderForm;
  readonly state: CodForm;
}

/** Home or office, priced for the picked wilaya; home asks for the address. */
export function DeliveryChoice({ form, state }: Props) {
  const t = useTranslations('orderForm');
  const { fields } = state;
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="tk-field__label pb-2">{t('delivery')}</legend>
      {deliveryOptions(form, fields.wilayaCode).map((option) => (
        <OptionRow key={option.deliveryType} option={option} state={state} />
      ))}
      {fields.deliveryType === 'home' && (
        <label className="tk-field">
          <span className="tk-field__label">{t('address')}</span>
          <input
            className="tk-input"
            required
            minLength={3}
            maxLength={255}
            autoComplete="street-address"
            value={fields.address}
            onChange={(event) => state.patch({ address: event.currentTarget.value })}
          />
        </label>
      )}
      {fields.deliveryType === 'stopdesk' && (
        <p className="text-sm text-muted">{t('stopDeskNote')}</p>
      )}
    </fieldset>
  );
}

function OptionRow({
  option,
  state,
}: {
  readonly option: DeliveryOption;
  readonly state: CodForm;
}) {
  const t = useTranslations('orderForm');
  const locale = useLocale() as Locale;
  return (
    <label className="flex items-center gap-3 rounded-panel border border-border bg-surface p-3">
      <input
        type="radio"
        name="deliveryType"
        required
        checked={state.fields.deliveryType === option.deliveryType}
        onChange={() => state.patch({ deliveryType: option.deliveryType })}
      />
      <span className="flex-1">{t(`deliveryType.${option.deliveryType}`)}</span>
      {option.price !== null && (
        <span className="font-medium">{formatDzd(option.price, locale)}</span>
      )}
    </label>
  );
}
