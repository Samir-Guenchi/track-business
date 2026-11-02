import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

/**
 * The customer's tracking pages: no app shell, no session, light enough for slow 3G. Only the
 * delivery choices (#136) run in the browser, so only their messages are sent.
 */
export default async function PublicTrackingLayout({ children }: { readonly children: ReactNode }) {
  const t = await getTranslations('tracking');
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={{ deliveryChoices: messages['deliveryChoices'] ?? {} }}>
      <div className="flex min-h-screen flex-col bg-canvas text-ink">
        <main id="main" className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
          {children}
        </main>
        <footer className="flex flex-col items-center gap-1 pb-6 text-xs text-muted">
          <span>{t('updated')}</span>
          <span dir="auto">{t('poweredBy')}</span>
        </footer>
      </div>
    </NextIntlClientProvider>
  );
}
