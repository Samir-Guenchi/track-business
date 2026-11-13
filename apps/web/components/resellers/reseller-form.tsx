'use client';

import { ResellerInputSchema } from '@trackecom/contracts';
import { Button, Input } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { useAddReseller } from '../../lib/resellers/resellers-queries';
import { FormAlert } from '../auth/form-alert';
import { useErrorMessage } from '../auth/use-error-message';

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
    <form className="flex flex-col gap-3" onSubmit={onSubmit} noValidate>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input label={t('name')} value={name} onChange={(e) => setName(e.currentTarget.value)} />
        <Input
          label={t('phone')}
          value={phone}
          type="tel"
          dir="ltr"
          onChange={(e) => setPhone(e.currentTarget.value)}
        />
      </div>
      <FormAlert message={invalid ? t('invalid') : null} />
      <FormAlert message={add.isError ? errorMessage(add.error) : null} />
      <div className="flex gap-2">
        <Button type="submit" loading={add.isPending}>
          {t('save')}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          {t('cancel')}
        </Button>
      </div>
    </form>
  );
}
