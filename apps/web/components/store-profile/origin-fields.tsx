'use client';

import { PhoneInput, type UiLocale, WilayaCommuneSelect } from '@trackecom/ui';
import { useLocale, useTranslations } from 'next-intl';
import { useCommunes, useWilayas } from '../../lib/geo/geo-queries';
import type { ProfileFormState } from './use-profile-form';

/** Where parcels leave from and the number customers can call. */
export function OriginFields({ form }: { readonly form: ProfileFormState }) {
  const t = useTranslations('storeProfile');
  const locale = useLocale() as UiLocale;
  const { draft, patch, errors } = form;
  const wilayas = useWilayas().data?.items ?? [];
  const communes = useCommunes(draft.originWilayaCode).data?.items ?? [];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <WilayaCommuneSelect
          wilayas={wilayas}
          communes={communes}
          wilayaCode={draft.originWilayaCode}
          communeId={draft.originCommuneId}
          locale={locale}
          wilayaLabel={t('originWilaya')}
          communeLabel={t('originCommune')}
          wilayaPlaceholder={t('wilayaPlaceholder')}
          communePlaceholder={t('communePlaceholder')}
          searchLabel={t('communeSearch')}
          emptyLabel={t('communeEmpty')}
          onWilayaChange={(code) => patch({ originWilayaCode: code, originCommuneId: undefined })}
          onCommuneChange={(id) => patch({ originCommuneId: id })}
        />
        <p className={errors.has('origin') ? 'tk-field__error' : 'text-xs text-muted'}>
          {errors.has('origin') ? t('errors.origin') : t('originHint')}
        </p>
      </div>
      <PhoneInput
        label={t('contactPhone')}
        value={draft.contactPhone}
        onValueChange={(contactPhone) => patch({ contactPhone })}
        {...(errors.has('contactPhone') ? { error: t('errors.contactPhone') } : {})}
      />
    </div>
  );
}
