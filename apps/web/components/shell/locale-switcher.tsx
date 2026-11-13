'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@trackecom/ui';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { usePathname, useRouter } from '../../i18n/navigation';
import { isLocale, locales, type Locale } from '../../i18n/routing';

/** Each language is named in itself so a reader can always find their own. */
const localeNames: Readonly<Record<Locale, string>> = {
  ar: 'العربية',
  fr: 'Français',
  en: 'English',
};

export function LocaleSwitcher() {
  const t = useTranslations('shell');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function change(next: string): void {
    if (!isLocale(next)) return;
    startTransition(() => router.replace(pathname, { locale: next }));
  }

  return (
    <Select value={locale} onValueChange={change} disabled={isPending}>
      <SelectTrigger aria-label={t('language')} className="w-28 sm:w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((code) => (
          <SelectItem key={code} value={code} lang={code}>
            {localeNames[code]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
