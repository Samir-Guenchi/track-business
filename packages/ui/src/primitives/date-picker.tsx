'use client';

import { Input, type InputProps } from './input.js';

export type DatePickerProps = Omit<InputProps, 'type'>;

export function DatePicker(props: DatePickerProps) {
  return <Input type="date" {...props} />;
}
