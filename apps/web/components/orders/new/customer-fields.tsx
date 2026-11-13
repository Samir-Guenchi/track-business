'use client';

import { Input, PhoneInput, type UiLocale, WilayaCommuneSelect } from '@trackecom/ui';
import { useLocale, useTranslations } from 'next-intl';
import { useCommunes, useWilayas } from '../../../lib/geo/geo-queries';
import { DetailCard } from '../detail/detail-card';
import { type DraftSectionProps, fieldError } from './field-error';
import { PhoneLookup } from './phone-lookup';
import type { DraftControls } from './use-order-draft';

export const PHONE_INPUT_ID = 'new-order-phone';

interface CustomerFieldsProps extends DraftSectionProps {
  readonly controls: DraftControls;
}

export function CustomerFields({ controls, errors }: CustomerFieldsProps) {
  const t = useTranslations('orders.new');
  const { draft, patch } = controls;
  return (
    <DetailCard title={t('customer')}>
      <PhoneInput
        id={PHONE_INPUT_ID}
        label={t('phone')}
        autoFocus
        value={draft.phone}
        onValueChange={(phone) => patch({ phone })}
        {...fieldError(errors, 'phone', t('errors.phone'))}
      />
      <PhoneLookup controls={controls} />
      <Input
        label={t('name')}
        autoComplete="off"
        value={draft.name}
        onChange={(event) => patch({ name: event.currentTarget.value })}
        {...fieldError(errors, 'name', t('errors.name'))}
      />
      <GeoFields controls={controls} errors={errors} />
    </DetailCard>
  );
}

function GeoFields({ controls, errors }: CustomerFieldsProps) {
  const t = useTranslations('orders.new');
  const locale = useLocale() as UiLocale;
  const { draft, patch } = controls;
  const wilayas = useWilayas().data?.items ?? [];
  const communes = useCommunes(draft.wilayaCode).data?.items ?? [];
  const geoError = [
    errors.has('wilaya') && t('errors.wilaya'),
    errors.has('commune') && t('errors.commune'),
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className="flex flex-col gap-1">
      <WilayaCommuneSelect
        wilayas={wilayas}
        communes={communes}
        wilayaCode={draft.wilayaCode}
        communeId={draft.communeId}
        locale={locale}
        wilayaLabel={t('wilaya')}
        communeLabel={t('commune')}
        wilayaPlaceholder={t('wilayaPlaceholder')}
        communePlaceholder={t('communePlaceholder')}
        searchLabel={t('communeSearch')}
        emptyLabel={t('communeEmpty')}
        onWilayaChange={(wilayaCode) => patch({ wilayaCode })}
        onCommuneChange={(communeId) => patch({ communeId })}
      />
      {geoError && <p className="tk-field__error">{geoError}</p>}
    </div>
  );
}
