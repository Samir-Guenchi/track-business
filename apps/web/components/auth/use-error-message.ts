'use client';

import { useTranslations } from 'next-intl';
import { ApiClientError } from '../../lib/api/api-client-error';

/** Turns an API failure into a sentence in the reader's language. Unknown codes stay generic. */
export function useErrorMessage(): (error: unknown) => string {
  const t = useTranslations('auth.errors');
  return (error) => {
    if (error instanceof ApiClientError && t.has(error.code)) return t(error.code);
    if (error instanceof TypeError) return t('network');
    return t('generic');
  };
}
