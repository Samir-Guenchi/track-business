import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';

/** The customer's tracking pages: no app shell, no session, light enough for slow 3G. */
export default async function PublicTrackingLayout({ children }: { readonly children: ReactNode }) {
  const t = await getTranslations('tracking');
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <main id="main" className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        {children}
      </main>
      <footer className="flex flex-col items-center gap-1 pb-6 text-xs text-muted">
        <span>{t('updated')}</span>
        <span dir="auto">{t('poweredBy')}</span>
      </footer>
    </div>
  );
}
