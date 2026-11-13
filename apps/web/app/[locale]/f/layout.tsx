import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

/**
 * The customer's order form (#134), alone or in a landing page's iframe: no app shell, no
 * session, and only the form's and the stop-desk picker's messages sent to the browser.
 */
export default async function PublicFormLayout({ children }: { readonly children: ReactNode }) {
  const messages = await getMessages();
  const t = await getTranslations('orderForm');
  return (
    <NextIntlClientProvider
      messages={{
        orderForm: messages['orderForm'] ?? {},
        stopDesks: messages['stopDesks'] ?? {},
      }}
    >
      <div className="flex min-h-screen flex-col bg-canvas text-ink">
        <main id="main" className="mx-auto w-full max-w-lg flex-1 px-4 py-5">
          {children}
        </main>
        <footer className="pb-4 text-center text-xs text-muted" dir="auto">
          {t('poweredBy')}
        </footer>
      </div>
    </NextIntlClientProvider>
  );
}
