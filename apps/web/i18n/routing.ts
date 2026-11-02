import { defineRouting } from 'next-intl/routing';

export const locales = ['ar', 'fr', 'en'] as const;
export type Locale = (typeof locales)[number];

/** Locales written right to left. Arabic is first-class, not an afterthought. */
const rtlLocales: ReadonlySet<Locale> = new Set(['ar']);

export function directionOf(locale: Locale): 'rtl' | 'ltr' {
  return rtlLocales.has(locale) ? 'rtl' : 'ltr';
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** The browser's Accept-Language picks the first locale; `fr` is the fallback. */
export const routing = defineRouting({
  locales,
  defaultLocale: 'fr',
  localePrefix: 'always',
  localeDetection: true,
});
