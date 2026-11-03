'use client';

import {
  type DailyVolume,
  DailyVolumeSchema,
  type Locale,
  LocaleSchema,
  type StoreProfile,
} from '@trackecom/contracts';
import { Button } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { type FormEvent, type ReactNode, useState } from 'react';
import { FormAlert } from '../auth/form-alert';
import { CarrierFields } from './carrier-fields';
import { ChoiceGroup } from './choice-group';
import { OriginFields } from './origin-fields';
import { type ProfileFormState, useProfileForm } from './use-profile-form';

interface StoreProfileFormProps {
  readonly profile: StoreProfile;
  readonly submitLabel: string;
  /** Called after a save that went through (or had nothing to send). */
  readonly onSaved?: () => void;
  /** Extra actions next to the submit button, e.g. "skip for now". */
  readonly actions?: ReactNode;
}

/** The store profile (#160), shared by the onboarding step and the settings page. */
export function StoreProfileForm({
  profile,
  submitLabel,
  onSaved,
  actions,
}: StoreProfileFormProps) {
  const t = useTranslations('storeProfile');
  const form = useProfileForm(profile);
  const [saved, setSaved] = useState(false);
  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaved(false);
    if (!(await form.save())) return;
    setSaved(true);
    onSaved?.();
  };
  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      <FormAlert message={form.apiError} />
      <OriginFields form={form} />
      <ChoiceFields form={form} />
      <CarrierFields form={form} />
      <FormAlert message={saved ? t('saved') : null} tone="success" />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={form.isPending}>
          {submitLabel}
        </Button>
        {actions}
      </div>
    </form>
  );
}

function ChoiceFields({ form }: { readonly form: ProfileFormState }) {
  const t = useTranslations('storeProfile');
  return (
    <>
      <ChoiceGroup<DailyVolume>
        legend={t('dailyVolume')}
        name="dailyVolume"
        options={DailyVolumeSchema.options.map((value) => ({ value, label: t(`volume.${value}`) }))}
        value={form.draft.dailyVolume}
        onChange={(dailyVolume) => form.patch({ dailyVolume })}
      />
      <ChoiceGroup<Locale>
        legend={t('defaultLanguage')}
        name="defaultLanguage"
        options={LocaleSchema.options.map((value) => ({ value, label: t(`language.${value}`) }))}
        value={form.draft.defaultLanguage}
        onChange={(defaultLanguage) => form.patch({ defaultLanguage })}
      />
    </>
  );
}
