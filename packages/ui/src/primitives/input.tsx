'use client';

import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '../cn.js';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label?: string;
  readonly hint?: string;
  readonly error?: string;
}

export function Input({
  label,
  hint,
  error,
  className,
  id,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? props.name ?? generatedId;
  const description = error ?? hint;
  const describedBy =
    [ariaDescribedBy, description ? `${inputId}-description` : undefined]
      .filter(Boolean)
      .join(' ') || undefined;
  return (
    <label className="tk-field" htmlFor={inputId}>
      {label && <span className="tk-field__label">{label}</span>}
      <input
        {...props}
        className={cn('tk-input', className)}
        id={inputId}
        aria-describedby={describedBy}
        aria-invalid={error ? true : ariaInvalid}
      />
      {description && (
        <span
          id={`${inputId}-description`}
          className={error ? 'tk-field__error' : 'tk-field__hint'}
        >
          {description}
        </span>
      )}
    </label>
  );
}
