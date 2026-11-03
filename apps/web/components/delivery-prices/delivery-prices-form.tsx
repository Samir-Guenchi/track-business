'use client';

import type { StorePricesResponse, Wilaya } from '@trackecom/contracts';
import { Button, Input } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { FormAlert } from '../auth/form-alert';
import { GridTools } from './grid-tools';
import { PriceTable } from './price-table';
import { usePriceGrid } from './use-price-grid';

interface DeliveryPricesFormProps {
  readonly prices: StorePricesResponse;
  readonly wilayas: readonly Wilaya[];
}

/** What customers pay for delivery, per wilaya, and the free-delivery rule (#33, #194). */
export function DeliveryPricesForm({ prices, wilayas }: DeliveryPricesFormProps) {
  const t = useTranslations('deliveryPrices');
  const grid = usePriceGrid(prices);
  const [filter, setFilter] = useState('');
  const [saved, setSaved] = useState(false);
  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaved(false);
    setSaved(await grid.save());
  };
  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
      <FormAlert message={grid.apiError} />
      <GridTools grid={grid} />
      <p className="text-sm text-muted">{t('tableHint')}</p>
      <Input
        label={t('search')}
        value={filter}
        onChange={(event) => setFilter(event.currentTarget.value)}
      />
      <PriceTable grid={grid} wilayas={wilayas} filter={filter} />
      <FormAlert message={saved ? t('saved') : null} tone="success" />
      <Button type="submit" loading={grid.isPending} className="sticky bottom-4 self-start">
        {t('save')}
      </Button>
    </form>
  );
}
