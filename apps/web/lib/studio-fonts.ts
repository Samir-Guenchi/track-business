import localFont from 'next/font/local';

/**
 * Studio display and interface faces, scoped to the reseller surfaces.
 * Arabic falls through to IBM Plex Sans Arabic, which the rest of the app already ships.
 */
export const studioSans = localFont({
  src: '../assets/fonts/space-grotesk-latin.woff2',
  weight: '300 700',
  style: 'normal',
  variable: '--font-studio-sans',
  display: 'swap',
  fallback: ['Inter', 'IBM Plex Sans Arabic', 'sans-serif'],
});

export const studioDisplay = localFont({
  src: [
    { path: '../assets/fonts/instrument-serif-latin.woff2', weight: '400', style: 'normal' },
    { path: '../assets/fonts/instrument-serif-italic-latin.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-studio-display',
  display: 'swap',
  fallback: ['Georgia', 'IBM Plex Sans Arabic', 'serif'],
});

export const studioFontClassName = `${studioSans.variable} ${studioDisplay.variable}`;
