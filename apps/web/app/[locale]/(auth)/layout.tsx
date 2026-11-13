import type { ReactNode } from 'react';
import { ClientProviders } from '../../../components/providers/client-providers';
import { LocaleSwitcher } from '../../../components/shell/locale-switcher';
import { ThemeToggle } from '../../../components/shell/theme-toggle';

/** Public pages: sign up, log in, password and invitation links. */
export default function AuthLayout({ children }: { readonly children: ReactNode }) {
  return (
    <ClientProviders>
      <div className="flex min-h-screen flex-col bg-canvas text-ink">
        <header className="flex justify-end gap-2 p-4">
          <LocaleSwitcher />
          <ThemeToggle />
        </header>
        <main
          id="main"
          className="flex flex-1 items-start justify-center px-4 pb-12 pt-4 sm:items-center"
        >
          {children}
        </main>
      </div>
    </ClientProviders>
  );
}
