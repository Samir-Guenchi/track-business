import { getRequestConfig } from 'next-intl/server';
import type { AbstractIntlMessages } from 'next-intl';
import { isLocale, routing, type Locale } from './routing';
import { namespaces } from './namespaces';

async function loadMessages(locale: Locale): Promise<AbstractIntlMessages> {
  const entries = await Promise.all(
    namespaces.map(async (namespace) => {
      const file = (await import(`../messages/${locale}/${namespace}.json`)) as {
        default: AbstractIntlMessages;
      };
      return [namespace, file.default] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isLocale(requested) ? requested : routing.defaultLocale;
  return { locale, messages: await loadMessages(locale), timeZone: 'Africa/Algiers' };
});
