import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import type { ReactNode } from 'react';

/** The reseller's portal (#198): no app shell, no session; the secret link is the key. */
export default async function ResellerPortalLayout({ children }: { readonly children: ReactNode }) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider
      messages={{
        resellerPortal: messages['resellerPortal'] ?? {},
        resellers: messages['resellers'] ?? {},
      }}
    >
      <div className="flex min-h-screen flex-col bg-canvas text-ink">
        <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-5">
          {children}
        </main>
      </div>
    </NextIntlClientProvider>
  );
}
