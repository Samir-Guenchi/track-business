'use client';

import { Input } from '@trackecom/ui';
import { useTranslations } from 'next-intl';

type ErrorFor = (field: string, message: string) => { error?: string };

export function EmailField({ errorFor }: { readonly errorFor: ErrorFor }) {
  const t = useTranslations('auth');
  return (
    <Input
      name="email"
      type="email"
      autoComplete="email"
      dir="ltr"
      required
      label={t('fields.email')}
      {...errorFor('email', t('invalid.email'))}
    />
  );
}

interface PasswordFieldProps {
  readonly errorFor: ErrorFor;
  /** A password being chosen (sign up, reset) shows the length hint and lets managers suggest one. */
  readonly isNew?: boolean;
  /** Reset says "new password"; sign up just says "password". */
  readonly isReplacement?: boolean;
}

export function PasswordField({
  errorFor,
  isNew = false,
  isReplacement = false,
}: PasswordFieldProps) {
  const t = useTranslations('auth');
  return (
    <Input
      name="password"
      type="password"
      autoComplete={isNew ? 'new-password' : 'current-password'}
      required
      label={t(isReplacement ? 'fields.newPassword' : 'fields.password')}
      {...(isNew ? { hint: t('passwordHint') } : {})}
      {...errorFor('password', t('invalid.password'))}
    />
  );
}
