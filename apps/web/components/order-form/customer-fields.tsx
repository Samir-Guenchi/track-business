'use client';

import { useTranslations } from 'next-intl';
import type { CodForm } from './use-cod-form';

/** Name and phone, plus the honeypot out of sight and out of the tab order. */
export function CustomerFields({ state }: { readonly state: CodForm }) {
  const t = useTranslations('orderForm');
  const { fields, patch } = state;
  return (
    <>
      <label className="tk-field">
        <span className="tk-field__label">{t('name')}</span>
        <input
          className="tk-input"
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
          value={fields.name}
          onChange={(event) => patch({ name: event.currentTarget.value })}
        />
      </label>
      <PhoneField state={state} />
      <Honeypot state={state} />
    </>
  );
}

function PhoneField({ state }: { readonly state: CodForm }) {
  const t = useTranslations('orderForm');
  return (
    <label className="tk-field">
      <span className="tk-field__label">{t('phone')}</span>
      <input
        className="tk-input"
        required
        type="tel"
        inputMode="tel"
        dir="ltr"
        autoComplete="tel"
        placeholder="05 55 12 34 56"
        value={state.fields.phone}
        onChange={(event) => state.patch({ phone: event.currentTarget.value })}
      />
      <span className="text-xs text-muted">{t('phoneHint')}</span>
    </label>
  );
}

/** People never see it; form-filling bots do, and the server refuses what they send. */
function Honeypot({ state }: { readonly state: CodForm }) {
  return (
    <input
      type="text"
      name="website"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      className="absolute -start-[9999px] h-0 w-0 opacity-0"
      value={state.fields.website}
      onChange={(event) => state.patch({ website: event.currentTarget.value })}
    />
  );
}
