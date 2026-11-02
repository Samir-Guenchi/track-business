import type { ReactNode } from 'react';
import { SessionGate } from '../../../components/session/session-gate';
import { AppShell } from '../../../components/shell/app-shell';

export default function SellerAppLayout({ children }: { readonly children: ReactNode }) {
  return (
    <SessionGate>
      <AppShell>{children}</AppShell>
    </SessionGate>
  );
}
