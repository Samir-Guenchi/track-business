'use client';

import type { SubmitFormOrderResponse } from '@trackecom/contracts';
import { CheckCircle2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '../../i18n/routing';
import { formatDzd } from '../../lib/format';

export function ThankYou({ order }: { readonly order: SubmitFormOrderResponse }) {
  const t = useTranslations('orderForm.thanks');
  const locale = useLocale() as Locale;
  return (
    <div role="status" className="flex flex-col items-center gap-3 py-8 text-center">
      <CheckCircle2 className="size-12 text-tape" aria-hidden="true" />
      <h2 className="text-xl font-semibold">{t('title')}</h2>
      <p>{t('body', { ref: order.ref })}</p>
      <p className="font-semibold">{t('total', { total: formatDzd(order.total, locale) })}</p>
    </div>
  );
}
