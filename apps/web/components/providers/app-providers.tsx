'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider, ToastViewport, TooltipProvider } from '@trackecom/ui';
import { useState, type ReactNode } from 'react';
import { getQueryClient } from '../../lib/api/query-client';

/** Client-side providers shared by every page: data fetching, tooltips, toasts. */
export function AppProviders({ children }: { readonly children: ReactNode }) {
  const [queryClient] = useState(getQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <ToastProvider>
          {children}
          <ToastViewport />
        </ToastProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
