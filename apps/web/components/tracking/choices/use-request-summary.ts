'use client';

import type { CreateDeliveryRequest } from '@trackecom/contracts';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '../../../i18n/routing';
import { formatCalendarDay } from '../../../lib/format';

/** One line per request, in the reader's language; the seller's screens use it too. */
export function useRequestSummary() {
  const t = useTranslations('deliveryChoices.summary');
  const locale = useLocale() as Locale;
  return (request: CreateDeliveryRequest): string => {
    switch (request.kind) {
      case 'reschedule':
        return t('reschedule', { day: formatCalendarDay(request.date, locale) });
      case 'call_after':
        return t('call_after', { time: request.time });
      case 'fix_address':
        return t('fix_address', { address: request.address });
      case 'switch_stopdesk':
        return t('switch_stopdesk');
    }
  };
}
