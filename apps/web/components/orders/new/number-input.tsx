'use client';

import { Input, type InputProps } from '@trackecom/ui';

interface NumberInputProps extends Omit<InputProps, 'value' | 'onChange' | 'type'> {
  /** Null shows an empty box (for example a delivery price not known yet). */
  readonly value: number | null;
  readonly onValueChange: (value: number | null) => void;
}

/** Whole dinars or quantities: digits only, empty means null. */
export function NumberInput({ value, onValueChange, ...props }: NumberInputProps) {
  return (
    <Input
      {...props}
      type="number"
      inputMode="numeric"
      min={0}
      step={1}
      dir="ltr"
      value={value ?? ''}
      onChange={(event) => {
        const number = event.currentTarget.valueAsNumber;
        onValueChange(Number.isNaN(number) ? null : number);
      }}
    />
  );
}
