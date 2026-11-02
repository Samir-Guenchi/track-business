'use client';

import type { Commune, Wilaya } from '@trackecom/contracts';
import { Combobox, type ComboboxOption } from '../primitives/combobox.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../primitives/select.js';
import type { UiLocale } from './money-dzd.js';

export interface WilayaCommuneSelectProps {
  readonly wilayas: readonly Wilaya[];
  readonly communes: readonly Commune[];
  readonly wilayaCode?: number | undefined;
  readonly communeId?: number | undefined;
  readonly locale: UiLocale;
  readonly wilayaLabel: string;
  readonly communeLabel: string;
  readonly wilayaPlaceholder: string;
  readonly communePlaceholder: string;
  readonly searchLabel: string;
  readonly emptyLabel: string;
  readonly onWilayaChange: (wilayaCode: number | undefined) => void;
  readonly onCommuneChange: (communeId: number | undefined) => void;
}

function communeOptionsFor(
  communes: readonly Commune[],
  wilayaCode: number | undefined,
  locale: UiLocale,
): ComboboxOption[] {
  return communes
    .filter((commune) => commune.wilayaCode === wilayaCode)
    .map((commune) => ({
      value: String(commune.id),
      label: nameFor(locale, commune.nameAr, commune.nameFr),
    }));
}

function nameFor(locale: UiLocale, nameAr: string, nameFr: string): string {
  return locale === 'ar' ? nameAr : nameFr;
}

interface WilayaPickerProps {
  readonly wilayas: readonly Wilaya[];
  readonly value?: number | undefined;
  readonly locale: UiLocale;
  readonly label: string;
  readonly placeholder: string;
  readonly onChange: (value: string) => void;
}

function WilayaPicker({ wilayas, value, locale, label, placeholder, onChange }: WilayaPickerProps) {
  return (
    <div className="tk-field">
      <span className="tk-field__label">{label}</span>
      <Select value={value === undefined ? undefined : String(value)} onValueChange={onChange}>
        <SelectTrigger aria-label={label}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {wilayas.map((wilaya) => (
            <SelectItem key={wilaya.code} value={String(wilaya.code)}>
              {wilaya.code.toString().padStart(2, '0')} ·{' '}
              {nameFor(locale, wilaya.nameAr, wilaya.nameFr)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface CommunePickerProps {
  readonly options: readonly ComboboxOption[];
  readonly value?: number | undefined;
  readonly label: string;
  readonly placeholder: string;
  readonly searchLabel: string;
  readonly emptyLabel: string;
  readonly disabled: boolean;
  readonly onChange: (value: string) => void;
}

function CommunePicker({
  options,
  value,
  label,
  placeholder,
  searchLabel,
  emptyLabel,
  disabled,
  onChange,
}: CommunePickerProps) {
  return (
    <div className="tk-field">
      <span className="tk-field__label">{label}</span>
      <Combobox
        options={options}
        value={value === undefined ? undefined : String(value)}
        label={label}
        placeholder={placeholder}
        searchLabel={searchLabel}
        emptyLabel={emptyLabel}
        disabled={disabled}
        onValueChange={onChange}
      />
    </div>
  );
}

export function WilayaCommuneSelect(props: WilayaCommuneSelectProps) {
  const options = communeOptionsFor(props.communes, props.wilayaCode, props.locale);
  const changeWilaya = (value: string) => {
    props.onWilayaChange(value ? Number(value) : undefined);
    props.onCommuneChange(undefined);
  };
  const changeCommune = (value: string) => props.onCommuneChange(value ? Number(value) : undefined);
  return (
    <div className="tk-geo-selects">
      <WilayaPicker
        wilayas={props.wilayas}
        value={props.wilayaCode}
        locale={props.locale}
        label={props.wilayaLabel}
        placeholder={props.wilayaPlaceholder}
        onChange={changeWilaya}
      />
      <CommunePicker
        options={options}
        value={props.communeId}
        label={props.communeLabel}
        placeholder={props.communePlaceholder}
        searchLabel={props.searchLabel}
        emptyLabel={props.emptyLabel}
        disabled={props.wilayaCode === undefined}
        onChange={changeCommune}
      />
    </div>
  );
}
