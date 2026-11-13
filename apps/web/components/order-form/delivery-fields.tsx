'use client';

import type { PublicOrderForm, Wilaya } from '@trackecom/contracts';
import { useLocale, useTranslations } from 'next-intl';
import { deliversTo, placeLabel } from '../../lib/forms/form-total';
import { DeliveryChoice } from './delivery-choice';
import type { CodForm } from './use-cod-form';
import { useCommunes } from './use-communes';

interface Props {
  readonly form: PublicOrderForm;
  readonly wilayas: readonly Wilaya[];
  readonly state: CodForm;
}

/** Wilaya and commune (only where the store delivers), then home or office. */
export function DeliveryFields({ form, wilayas, state }: Props) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <WilayaSelect form={form} wilayas={wilayas} state={state} />
        <CommuneSelect state={state} />
      </div>
      <DeliveryChoice form={form} state={state} />
    </>
  );
}

function WilayaSelect({ form, wilayas, state }: Props) {
  const t = useTranslations('orderForm');
  const locale = useLocale();
  const pick = (value: string) =>
    state.patch({ wilayaCode: value ? Number(value) : undefined, communeId: undefined });
  return (
    <label className="tk-field">
      <span className="tk-field__label">{t('wilaya')}</span>
      <select
        className="tk-input"
        required
        value={state.fields.wilayaCode ?? ''}
        onChange={(event) => pick(event.currentTarget.value)}
      >
        <option value="">{t('chooseWilaya')}</option>
        {wilayas
          .filter((wilaya) => deliversTo(form, wilaya.code))
          .map((wilaya) => (
            <option key={wilaya.code} value={wilaya.code}>
              {placeLabel(wilaya, locale)}
            </option>
          ))}
      </select>
    </label>
  );
}

function CommuneSelect({ state }: { readonly state: CodForm }) {
  const t = useTranslations('orderForm');
  const locale = useLocale();
  const communes = useCommunes(state.fields.wilayaCode);
  return (
    <label className="tk-field">
      <span className="tk-field__label">{t('commune')}</span>
      <select
        className="tk-input"
        required
        value={state.fields.communeId ?? ''}
        onChange={(event) =>
          state.patch({ communeId: Number(event.currentTarget.value) || undefined })
        }
      >
        <option value="">{t('chooseCommune')}</option>
        {communes.map((commune) => (
          <option key={commune.id} value={commune.id}>
            {placeLabel(commune, locale)}
          </option>
        ))}
      </select>
    </label>
  );
}
