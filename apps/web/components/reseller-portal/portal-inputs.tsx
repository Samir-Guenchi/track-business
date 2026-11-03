'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

interface SelectFieldProps {
  readonly label: string;
  readonly value: string;
  readonly options: readonly { readonly value: string | number; readonly label: string }[];
  readonly onChange: (value: string) => void;
}

/** A required select with a "Choose" first option. */
export function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  const t = useTranslations('resellerPortal.form');
  return (
    <label className="tk-field">
      <span className="tk-field__label">{label}</span>
      <select
        className="tk-input"
        required
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      >
        <option value="">{t('choose')}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface TextFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly kind?: 'text' | 'tel' | 'number';
  readonly hint?: ReactNode;
}

/** A required text, phone or whole-number field. */
export function TextField({ label, value, onChange, kind = 'text', hint }: TextFieldProps) {
  const numeric = kind === 'number';
  return (
    <label className="tk-field">
      <span className="tk-field__label">{label}</span>
      <input
        className="tk-input"
        required
        value={value}
        {...(kind === 'tel' ? { dir: 'ltr', type: 'tel' } : {})}
        {...(numeric ? { inputMode: 'numeric' as const } : {})}
        onChange={(event) => {
          const typed = event.currentTarget.value;
          onChange(numeric ? typed.replace(/\D/g, '') : typed);
        }}
      />
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}
