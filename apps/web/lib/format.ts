import type { Locale } from '../i18n/routing';

/** Intl locale per UI locale. Latin digits everywhere: Algerian sellers read prices that way. */
const intlLocale: Readonly<Record<Locale, string>> = {
  ar: 'ar-DZ-u-nu-latn',
  fr: 'fr-DZ',
  en: 'en-DZ',
};

export const ALGIERS_TIME_ZONE = 'Africa/Algiers';

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale[locale]).format(value);
}

export function formatDzd(amountDzd: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale[locale], {
    style: 'currency',
    currency: 'DZD',
    maximumFractionDigits: 0,
  }).format(amountDzd);
}

export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], {
    dateStyle: 'medium',
    timeZone: ALGIERS_TIME_ZONE,
  }).format(date);
}

export function formatDateTime(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: ALGIERS_TIME_ZONE,
  }).format(date);
}
