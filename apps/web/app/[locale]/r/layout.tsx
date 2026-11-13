import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import type { ReactNode } from 'react';
import { studioFontClassName } from '../../../lib/studio-fonts';

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
      <div className={`studio ${studioFontClassName}`}>
        <main id="main">{children}</main>
      </div>
    </NextIntlClientProvider>
  );
}
