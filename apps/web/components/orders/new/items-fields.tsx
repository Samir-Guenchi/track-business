'use client';

import { Button, Input } from '@trackecom/ui';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import type { DraftItem } from '../../../lib/orders/order-draft';
import { DetailCard } from '../detail/detail-card';
import type { DraftSectionProps } from './field-error';
import { NumberInput } from './number-input';
import type { DraftControls } from './use-order-draft';

interface ItemsFieldsProps extends DraftSectionProps {
  readonly controls: DraftControls;
  readonly children?: ReactNode;
}

/** One row per product; the totals below are passed as children so they sit in the same card. */
export function ItemsFields({ controls, errors, children }: ItemsFieldsProps) {
  const t = useTranslations('orders.new');
  const { items } = controls.draft;
  return (
    <DetailCard title={t('items')}>
      {items.map((item) => (
        <ItemRow key={item.key} item={item} controls={controls} canRemove={items.length > 1} />
      ))}
      {errors.has('item') && <p className="tk-field__error">{t('errors.item')}</p>}
      <Button variant="ghost" size="sm" className="self-start" onClick={controls.addItem}>
        <Plus size={16} aria-hidden />
        {t('addItem')}
      </Button>
      {children}
    </DetailCard>
  );
}

interface ItemRowProps {
  readonly item: DraftItem;
  readonly controls: DraftControls;
  readonly canRemove: boolean;
}

function ItemRow({ item, controls, canRemove }: ItemRowProps) {
  const t = useTranslations('orders.new');
  const change = (changes: Partial<Omit<DraftItem, 'key'>>) =>
    controls.changeItem(item.key, changes);
  return (
    <div className="grid grid-cols-[1fr_5rem_8rem_auto] items-end gap-2">
      <Input
        label={t('itemName')}
        value={item.name}
        onChange={(event) => change({ name: event.currentTarget.value })}
      />
      <NumberInput
        label={t('quantity')}
        value={item.quantity}
        onValueChange={(quantity) => change({ quantity: quantity ?? 0 })}
      />
      <NumberInput
        label={t('unitPrice')}
        value={item.unitPrice}
        onValueChange={(unitPrice) => change({ unitPrice: unitPrice ?? 0 })}
      />
      <Button
        variant="ghost"
        size="sm"
        aria-label={t('removeItem')}
        disabled={!canRemove}
        onClick={() => controls.removeItem(item.key)}
      >
        <Trash2 size={16} aria-hidden />
      </Button>
    </div>
  );
}
