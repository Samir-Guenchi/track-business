'use client';

import { useTranslations } from 'next-intl';
import { KNOWN_CARRIERS } from '../../lib/stores/known-carriers';
import { toggleCarrier } from '../../lib/stores/profile-draft';
import type { ProfileFormState } from './use-profile-form';

/** Carriers the store already works with, so we can suggest connecting them. */
export function CarrierFields({ form }: { readonly form: ProfileFormState }) {
  const t = useTranslations('storeProfile');
  const { draft, patch } = form;
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">{t('carriers')}</legend>
      <div className="grid grid-cols-2 gap-2">
        {KNOWN_CARRIERS.map((carrier) => (
          <label
            key={carrier.code}
            className="flex items-center gap-2 rounded-control border border-border bg-surface p-2 text-sm"
          >
            <input
              type="checkbox"
              checked={draft.carriers.includes(carrier.code)}
              onChange={() => patch({ carriers: toggleCarrier(draft.carriers, carrier.code) })}
            />
            {carrier.name}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
