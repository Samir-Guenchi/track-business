'use client';

import { Input } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import type { LegalTextField } from '../../lib/stores/legal-draft';
import type { LegalFormState } from './use-legal-form';

interface LegalInputProps {
  readonly form: LegalFormState;
  readonly field: LegalTextField;
}

/** One text field with its label, hint and the schema's error when refused. */
export function LegalInput({ form, field }: LegalInputProps) {
  const t = useTranslations('legal');
  const hint = t.has(`hints.${field}`) ? t(`hints.${field}`) : undefined;
  return (
    <Input
      label={t(`fields.${field}`)}
      value={form.draft[field]}
      onChange={(event) => form.patch({ [field]: event.currentTarget.value })}
      {...(form.invalid.has(field) ? { error: t(`errors.${field}`) } : hint ? { hint } : {})}
    />
  );
}

/** The registration number that matches the regime: RC, or the auto-entrepreneur card. */
export function RegistrationFields({ form }: { readonly form: LegalFormState }) {
  const auto = form.draft.regime === 'auto_entrepreneur';
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <LegalInput form={form} field="nif" />
      <LegalInput form={form} field="nis" />
      <LegalInput form={form} field={auto ? 'autoEntrepreneurCard' : 'rcNumber'} />
      <LegalInput form={form} field="articleImposition" />
    </div>
  );
}
