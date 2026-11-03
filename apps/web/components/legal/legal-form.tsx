'use client';

import {
  type LegalRegime,
  LegalRegimeSchema,
  type StoreLegalProfile,
  type TaxRegime,
  TaxRegimeSchema,
  missingForInvoice,
} from '@trackecom/contracts';
import { Button } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { FormAlert } from '../auth/form-alert';
import { ChoiceGroup } from '../store-profile/choice-group';
import { LegalInput, RegistrationFields } from './legal-fields';
import { type LegalFormState, useLegalForm } from './use-legal-form';

/** The legal identity printed on invoices (#140). */
export function LegalForm({ profile }: { readonly profile: StoreLegalProfile }) {
  const t = useTranslations('legal');
  const form = useLegalForm(profile);
  const [saved, setSaved] = useState(false);
  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaved(false);
    setSaved(await form.save());
  };
  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      <Readiness profile={profile} />
      <FormAlert message={form.apiError} />
      <RegimeFields form={form} />
      <LegalInput form={form} field="legalName" />
      <LegalInput form={form} field="address" />
      <RegistrationFields form={form} />
      <FormAlert message={saved ? t('saved') : null} tone="success" />
      <Button type="submit" loading={form.isPending} className="self-start">
        {t('save')}
      </Button>
    </form>
  );
}

function RegimeFields({ form }: { readonly form: LegalFormState }) {
  const t = useTranslations('legal');
  return (
    <>
      <ChoiceGroup<LegalRegime>
        legend={t('fields.regime')}
        name="regime"
        options={LegalRegimeSchema.options.map((value) => ({ value, label: t(`regime.${value}`) }))}
        value={form.draft.regime}
        onChange={(regime) => form.patch({ regime })}
      />
      <ChoiceGroup<TaxRegime>
        legend={t('fields.taxRegime')}
        name="taxRegime"
        options={TaxRegimeSchema.options.map((value) => ({
          value,
          label: t(`taxRegime.${value}`),
        }))}
        value={form.draft.taxRegime}
        onChange={(taxRegime) => form.patch({ taxRegime })}
      />
    </>
  );
}

/** Says, from the saved profile, whether invoices can be issued yet. */
function Readiness({ profile }: { readonly profile: StoreLegalProfile }) {
  const t = useTranslations('legal');
  const missing = missingForInvoice(profile);
  if (missing.length === 0) return <FormAlert message={t('ready')} tone="success" />;
  const fields = missing.map((field) => t(`fields.${field}`)).join(', ');
  return (
    <p className="rounded-control border border-border px-3 py-2 text-sm text-muted">
      {t('missing', { fields })}
    </p>
  );
}
