import type { ReactNode } from 'react';
import { AppShell } from '../../../components/shell/app-shell';

// TODO(#16): redirect to sign-in when there is no session.
export default function SellerAppLayout({ children }: { readonly children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
