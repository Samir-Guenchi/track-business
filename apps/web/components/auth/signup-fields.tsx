'use client';

import { Input, PhoneInput } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { EmailField, PasswordField } from './credential-fields';

interface SignupFieldsProps {
  readonly errorFor: (field: string, message: string) => { error?: string };
}

export function SignupFields({ errorFor }: SignupFieldsProps) {
  const t = useTranslations('auth');
  const [phone, setPhone] = useState('');
  const errorOf = (field: string) => errorFor(field, t(`invalid.${field}`));
  return (
    <>
      <Input
        name="name"
        autoComplete="name"
        required
        label={t('fields.name')}
        {...errorOf('name')}
      />
      <EmailField errorFor={errorFor} />
      <PhoneInput
        name="phone"
        value={phone}
        onValueChange={setPhone}
        label={t('fields.phone')}
        {...errorOf('phone')}
      />
      <PasswordField errorFor={errorFor} isNew />
    </>
  );
}
