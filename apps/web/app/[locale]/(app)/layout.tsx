import type { ReactNode } from 'react';
import { ClientProviders } from '../../../components/providers/client-providers';
import { SessionGate } from '../../../components/session/session-gate';
import { AppShell } from '../../../components/shell/app-shell';

export default function SellerAppLayout({ children }: { readonly children: ReactNode }) {
  return (
    <ClientProviders>
      <SessionGate>
        <AppShell>{children}</AppShell>
      </SessionGate>
    </ClientProviders>
  );
}
