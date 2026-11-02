'use client';

import { MoneyDZD, type UiLocale } from '@trackecom/ui';
import { useLocale, useTranslations } from 'next-intl';
import { codAmountOf, subtotalOf } from '../../../lib/orders/order-draft';
import { DetailRow } from '../detail/detail-card';
import { type DraftSectionProps, fieldError } from './field-error';
import { NumberInput } from './number-input';
import type { DraftControls } from './use-order-draft';

interface TotalsProps extends DraftSectionProps {
  readonly controls: DraftControls;
  readonly quotedFee: number | null;
  readonly feeUnavailable: boolean;
}

/** Subtotal, delivery price (the store's price unless the agent types another), discount, COD. */
export function Totals({ controls, quotedFee, feeUnavailable, errors }: TotalsProps) {
  const t = useTranslations('orders.new');
  const locale = useLocale() as UiLocale;
  const { draft, patch } = controls;
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3">
      <dl>
        <DetailRow label={t('subtotal')}>
          <MoneyDZD amount={subtotalOf(draft.items)} locale={locale} />
        </DetailRow>
      </dl>
      <div className="grid items-start gap-2 sm:grid-cols-2">
        <NumberInput
          label={t('shippingFee')}
          value={draft.shippingFeeOverride ?? quotedFee}
          onValueChange={(shippingFeeOverride) => patch({ shippingFeeOverride })}
          {...(feeUnavailable ? { hint: t('shippingUnavailable') } : {})}
          {...fieldError(errors, 'fee', t('errors.fee'))}
        />
        <NumberInput
          label={t('discount')}
          value={draft.discount}
          onValueChange={(discount) => patch({ discount: discount ?? 0 })}
        />
      </div>
      <dl>
        <DetailRow label={t('cod')}>
          <MoneyDZD className="text-lg" amount={codAmountOf(draft, quotedFee)} locale={locale} />
        </DetailRow>
      </dl>
    </div>
  );
}
