'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCommunes, useWilayas, wilayaLabel } from '../../lib/geo/geo-queries';
import type { PointDraft } from '../../lib/pickup-points/point-draft';

interface Props {
  readonly draft: PointDraft;
  readonly patch: (change: Partial<PointDraft>) => void;
  readonly invalid: readonly string[];
}

interface SelectProps {
  readonly label: string;
  readonly value: string;
  readonly invalid: boolean;
  readonly options: readonly { readonly value: number; readonly label: string }[];
  readonly onPick: (value: string) => void;
}

function PlaceSelect({ label, value, invalid, options, onPick }: SelectProps) {
  const t = useTranslations('pickupPoints.form');
  return (
    <label className="tk-field">
      <span className="tk-field__label">{label}</span>
      <select
        className="tk-input"
        aria-invalid={invalid}
        value={value}
        onChange={(event) => onPick(event.currentTarget.value)}
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

/** Wilaya then commune of the shop. */
export function PlaceFields({ draft, patch, invalid }: Props) {
  const t = useTranslations('pickupPoints.form');
  const locale = useLocale();
  const wilayas = useWilayas().data?.items ?? [];
  const wilayaCode = draft.wilayaCode ? Number(draft.wilayaCode) : undefined;
  const communes = useCommunes(wilayaCode).data?.items ?? [];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <PlaceSelect
        label={t('wilaya')}
        value={draft.wilayaCode}
        invalid={invalid.includes('wilayaCode')}
        options={wilayas.map((w) => ({ value: w.code, label: wilayaLabel(w, locale) }))}
        onPick={(value) => patch({ wilayaCode: value, communeId: '' })}
      />
      <PlaceSelect
        label={t('commune')}
        value={draft.communeId}
        invalid={invalid.includes('communeId')}
        options={communes.map((c) => ({
          value: c.id,
          label: locale === 'ar' ? c.nameAr : c.nameFr,
        }))}
        onPick={(value) => patch({ communeId: value })}
      />
    </div>
  );
}
