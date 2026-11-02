'use client';

import { AlgerianPhoneSchema } from '@trackecom/contracts';
import type { FocusEvent } from 'react';
import { Input, type InputProps } from '../primitives/input.js';

export interface PhoneInputProps extends Omit<
  InputProps,
  'onChange' | 'onBlur' | 'type' | 'value'
> {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
}

export function PhoneInput({ value, onValueChange, onBlur, ...props }: PhoneInputProps) {
  function normalizeOnBlur(event: FocusEvent<HTMLInputElement>) {
    const result = AlgerianPhoneSchema.safeParse(event.currentTarget.value);
    if (result.success) onValueChange(result.data);
    onBlur?.(event);
  }

  return (
    <Input
      {...props}
      dir="ltr"
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      placeholder="+213 5 00 00 00 00"
      value={value}
      onChange={(event) => onValueChange(event.currentTarget.value)}
      onBlur={normalizeOnBlur}
    />
  );
}
