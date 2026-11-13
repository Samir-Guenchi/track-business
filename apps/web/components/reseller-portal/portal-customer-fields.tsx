'use client';

import type { Wilaya } from '@trackecom/contracts';
import { useLocale, useTranslations } from 'next-intl';
import { useCommunes } from '../order-form/use-communes';
import { SelectField, TextField } from './portal-inputs';
import type { PortalDraft } from './use-portal-order';

interface Props {
  readonly draft: PortalDraft;
  readonly patch: (change: Partial<PortalDraft>) => void;
  readonly wilayas: readonly Wilaya[];
}

const placeName = (locale: string, place: { nameAr: string; nameFr: string }): string =>
  locale === 'ar' ? place.nameAr : place.nameFr;

function AddressField({
  value,
  onChange,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  const t = useTranslations('resellerPortal.form');
  return <TextField label={t('address')} value={value} wide onChange={onChange} />;
}

/** The customer's name, phone and address. */
export function PortalCustomerFields({ draft, patch, wilayas }: Props) {
  const t = useTranslations('resellerPortal.form');
  const locale = useLocale();
  const communes = useCommunes(draft.wilayaCode ? Number(draft.wilayaCode) : undefined);
  return (
    <>
      <TextField
        label={t('name')}
        value={draft.name}
        onChange={(value) => patch({ name: value })}
      />
      <TextField
        label={t('phone')}
        value={draft.phone}
        kind="tel"
        onChange={(value) => patch({ phone: value })}
      />
      <SelectField
        label={t('wilaya')}
        value={draft.wilayaCode}
        options={wilayas.map((wilaya) => ({
          value: wilaya.code,
          label: `${wilaya.code} · ${placeName(locale, wilaya)}`,
        }))}
        onChange={(value) => patch({ wilayaCode: value, communeId: '' })}
      />
      <SelectField
        label={t('commune')}
        value={draft.communeId}
        options={communes.map((commune) => ({
          value: commune.id,
          label: placeName(locale, commune),
        }))}
        onChange={(value) => patch({ communeId: value })}
      />
      <AddressField value={draft.address} onChange={(value) => patch({ address: value })} />
    </>
  );
}
