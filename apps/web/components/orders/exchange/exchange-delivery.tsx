'use client';

import { Input } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import type { ExchangeDraft } from '../../../lib/orders/exchange-draft';

interface Props {
  readonly draft: ExchangeDraft;
  readonly onChange: (draft: ExchangeDraft) => void;
}

const PAYERS = ['customer', 'store'] as const;

/** Who pays the second trip, and how much it costs. */
export function ExchangeDelivery({ draft, onChange }: Props) {
  const t = useTranslations('orders.exchange');
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="pb-1 text-sm font-medium">{t('paidBy')}</legend>
      <div className="flex gap-4">
        {PAYERS.map((payer) => (
          <label key={payer} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="deliveryPaidBy"
              checked={draft.deliveryPaidBy === payer}
              onChange={() => onChange({ ...draft, deliveryPaidBy: payer })}
            />
            {t(`payer.${payer}`)}
          </label>
        ))}
      </div>
      <Input
        type="number"
        label={t('shippingFee')}
        min={0}
        value={draft.shippingFee}
        onChange={(event) =>
          onChange({
            ...draft,
            shippingFee: Math.max(0, Math.floor(Number(event.currentTarget.value) || 0)),
          })
        }
      />
    </fieldset>
  );
}
