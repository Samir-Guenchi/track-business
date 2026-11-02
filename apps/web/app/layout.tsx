import type { ReactNode } from 'react';

/** The real document (`<html lang dir>`) is rendered per locale in `[locale]/layout.tsx`. */
export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return children;
}
