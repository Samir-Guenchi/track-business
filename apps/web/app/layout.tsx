import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'TrackEcom',
  description: 'Livraison suivie, partout en Algérie.',
};

// Locales, RTL and the design system arrive with #13 and #14.
export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
