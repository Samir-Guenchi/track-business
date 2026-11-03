'use client';

import { type DeliveryType, DeliveryTypeSchema } from '@trackecom/contracts';
import { Button, Input } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { PriceGridState } from './use-price-grid';

/** "Fill every empty home price with 600 DA". */
function FillEmpty({ grid }: { readonly grid: PriceGridState }) {
  const t = useTranslations('deliveryPrices');
  const [fillPrice, setFillPrice] = useState('');
  const [fillType, setFillType] = useState<DeliveryType>('home');
  return (
    <div className="flex flex-col gap-1">
      <span className="tk-field__label">{t('fillLabel')}</span>
      <div className="flex gap-2">
        <select
          aria-label={t('fillType')}
          className="tk-input h-10"
          value={fillType}
          onChange={(event) => setFillType(DeliveryTypeSchema.parse(event.currentTarget.value))}
        >
          <option value="home">{t('home')}</option>
          <option value="stopdesk">{t('stopdesk')}</option>
        </select>
        <input
          inputMode="numeric"
          aria-label={t('fillPrice')}
          className="tk-input h-10 w-24"
          value={fillPrice}
          onChange={(event) => setFillPrice(event.currentTarget.value.replace(/\D/g, ''))}
        />
        <Button
          variant="secondary"
          disabled={fillPrice === ''}
          onClick={() => grid.fill(fillType, Number(fillPrice))}
        >
          {t('fill')}
        </Button>
      </div>
    </div>
  );
}

/** Free-delivery threshold and the bulk fill, above the table. */
export function GridTools({ grid }: { readonly grid: PriceGridState }) {
  const t = useTranslations('deliveryPrices');
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input
        label={t('freeFrom')}
        inputMode="numeric"
        hint={t('freeFromHint')}
        value={grid.draft.freeShippingFrom}
        onChange={(event) => grid.setThreshold(event.currentTarget.value.replace(/\D/g, ''))}
      />
      <FillEmpty grid={grid} />
    </div>
  );
}
