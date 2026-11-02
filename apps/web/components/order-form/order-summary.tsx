'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '../../i18n/routing';
import { formatDzd } from '../../lib/format';
import type { Totals } from '../../lib/forms/form-total';

/** The total updates as the customer picks; the fee may wait for the call. */
export function OrderSummary({ totals }: { readonly totals: Totals }) {
  const t = useTranslations('orderForm.summary');
  const locale = useLocale() as Locale;
  const money = (value: number) => formatDzd(value, locale);
  const shipping =
    totals.shippingFee === null
      ? t('toConfirm')
      : totals.shippingFee === 0
        ? t('free')
        : money(totals.shippingFee);
  return (
    <dl className="flex flex-col gap-1 rounded-panel bg-kraft/40 p-4 text-sm">
      <div className="flex justify-between">
        <dt>{t('subtotal')}</dt>
        <dd>{money(totals.subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt>{t('shipping')}</dt>
        <dd>{shipping}</dd>
      </div>
      <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
        <dt>{t('total')}</dt>
        <dd>{money(totals.total)}</dd>
      </div>
    </dl>
  );
}
