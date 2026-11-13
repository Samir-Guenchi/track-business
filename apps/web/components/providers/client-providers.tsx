import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { AppProviders } from './app-providers';

/**
 * Messages and client providers for the seller app and its auth pages. The customer's tracking
 * page leaves them out so it stays light on slow 3G (#34).
 */
export function ClientProviders({ children }: { readonly children: ReactNode }) {
  return (
    <NextIntlClientProvider>
      <AppProviders>{children}</AppProviders>
    </NextIntlClientProvider>
  );
}
