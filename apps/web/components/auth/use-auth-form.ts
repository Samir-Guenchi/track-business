'use client';

import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import type { z } from 'zod';
import { formValues } from '../../lib/forms/form-values';
import { invalidFields } from '../../lib/forms/invalid-fields';
import { useErrorMessage } from './use-error-message';

interface AuthFormOptions<TSchema extends z.ZodType, TResult> {
  /** Contract schema of the request; the same one the API validates with. */
  readonly schema: TSchema;
  readonly submit: (body: z.infer<TSchema>) => Promise<TResult>;
  readonly onSuccess?: (result: TResult) => void;
  /** Values the form does not show as inputs (locale, token). */
  readonly extra?: Record<string, unknown>;
}

/** Validates with the shared zod schema before calling the API, then reports field and API errors. */
export function useAuthForm<TSchema extends z.ZodType, TResult>(
  options: AuthFormOptions<TSchema, TResult>,
) {
  const [invalid, setInvalid] = useState<ReadonlySet<string>>(new Set());
  const errorMessage = useErrorMessage();
  const mutation = useMutation({
    mutationFn: options.submit,
    ...(options.onSuccess ? { onSuccess: options.onSuccess } : {}),
  });

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const parsed = options.schema.safeParse({
      ...formValues(event.currentTarget),
      ...options.extra,
    });
    if (!parsed.success) {
      setInvalid(invalidFields(parsed.error));
      return;
    }
    setInvalid(new Set());
    mutation.mutate(parsed.data);
  }

  return {
    onSubmit,
    isInvalid: (field: string) => invalid.has(field),
    /** Spread on an input: `{...form.errorFor('email', t('invalid.email'))}`. */
    errorFor: (field: string, message: string): { error?: string } =>
      invalid.has(field) ? { error: message } : {},
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    apiError: mutation.isError ? errorMessage(mutation.error) : null,
  };
}
