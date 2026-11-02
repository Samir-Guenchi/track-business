import type { ReactNode } from 'react';
import { ClientProviders } from '../../../components/providers/client-providers';

export default function OnboardingLayout({ children }: { readonly children: ReactNode }) {
  return <ClientProviders>{children}</ClientProviders>;
}
