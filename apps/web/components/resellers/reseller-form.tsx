'use client';

import { ResellerInputSchema } from '@trackecom/contracts';
import { Button, Input } from '@trackecom/ui';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { useAddReseller } from '../../lib/resellers/resellers-queries';
import { FormAlert } from '../auth/form-alert';
import { useErrorMessage } from '../auth/use-error-message';

function FormHead({ onDone }: { readonly onDone: () => void }) {
  const t = useTranslations('resellers.form');
  return (
    <header className="studio-panel__head">
      <div>
        <p className="studio-eyebrow">{t('eyebrow')}</p>
        <h2 id="reseller-form-title">{t('title')}</h2>
        <p>{t('description')}</p>
      </div>
      <Button size="sm" variant="ghost" onClick={onDone} aria-label={t('cancel')}>
        <X size={16} aria-hidden />
      </Button>
    </header>
  );
}

function Fields({
  name,
  phone,
  onName,
  onPhone,
}: {
  readonly name: string;
  readonly phone: string;
  readonly onName: (value: string) => void;
  readonly onPhone: (value: string) => void;
}) {
  const t = useTranslations('resellers.form');
  return (
    <div className="studio-form-grid">
      <Input
        label={t('name')}
        value={name}
        onChange={(event) => onName(event.currentTarget.value)}
      />
      <Input
        label={t('phone')}
        value={phone}
        type="tel"
        dir="ltr"
        onChange={(event) => onPhone(event.currentTarget.value)}
      />
    </div>
  );
}

/** Add a reseller: a name and a phone; the portal link is made by the server. */
export function ResellerForm({ onDone }: { readonly onDone: () => void }) {
  const t = useTranslations('resellers.form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [invalid, setInvalid] = useState(false);
  const add = useAddReseller();
  const errorMessage = useErrorMessage();
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = ResellerInputSchema.safeParse({ name, phone });
    setInvalid(!parsed.success);
    if (parsed.success) add.mutate(parsed.data, { onSuccess: onDone });
  };
  return (
    <section className="studio-panel studio-form-panel" aria-labelledby="reseller-form-title">
      <FormHead onDone={onDone} />
      <div className="studio-panel__body">
        <form onSubmit={onSubmit} noValidate>
          <Fields name={name} phone={phone} onName={setName} onPhone={setPhone} />
          <FormAlert message={invalid ? t('invalid') : null} />
          <FormAlert message={add.isError ? errorMessage(add.error) : null} />
          <div className="studio-form-actions">
            <Button type="submit" loading={add.isPending}>
              {t('save')}
            </Button>
            <Button type="button" variant="ghost" onClick={onDone}>
              {t('cancel')}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
