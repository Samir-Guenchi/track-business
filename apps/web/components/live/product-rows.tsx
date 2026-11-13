'use client';

import { Button, Input } from '@trackecom/ui';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { nextCode, type ProductRow } from '../../lib/live/session-draft';

interface Props {
  readonly rows: readonly ProductRow[];
  readonly onChange: (rows: ProductRow[]) => void;
}

let rowKey = 0;
export const newRow = (rows: readonly ProductRow[]): ProductRow => {
  rowKey += 1;
  return { key: rowKey, code: nextCode(rows), name: '', unitPrice: 0 };
};

interface RowProps {
  readonly row: ProductRow;
  readonly onUpdate: (changes: Partial<ProductRow>) => void;
  readonly onRemove: () => void;
}

function Row({ row, onUpdate, onRemove }: RowProps) {
  const t = useTranslations('live.new');
  return (
    <div className="grid grid-cols-[4rem_1fr_7rem_auto] items-center gap-2">
      <Input
        aria-label={t('code')}
        value={row.code}
        maxLength={3}
        dir="ltr"
        onChange={(e) => onUpdate({ code: e.currentTarget.value })}
      />
      <Input
        aria-label={t('product')}
        placeholder={t('product')}
        value={row.name}
        maxLength={120}
        onChange={(e) => onUpdate({ name: e.currentTarget.value })}
      />
      <Input
        aria-label={t('price')}
        type="number"
        min={0}
        value={row.unitPrice}
        onChange={(e) => onUpdate({ unitPrice: Number(e.currentTarget.value) || 0 })}
      />
      <Button type="button" size="sm" variant="ghost" aria-label={t('remove')} onClick={onRemove}>
        <Trash2 size={14} aria-hidden />
      </Button>
    </div>
  );
}

/** The products shown during the live, each with the short code viewers comment. */
export function ProductRows({ rows, onChange }: Props) {
  const t = useTranslations('live.new');
  const update = (key: number, changes: Partial<ProductRow>) =>
    onChange(rows.map((row) => (row.key === key ? { ...row, ...changes } : row)));
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <Row
          key={row.key}
          row={row}
          onUpdate={(changes) => update(row.key, changes)}
          onRemove={() => onChange(rows.filter((other) => other.key !== row.key))}
        />
      ))}
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => onChange([...rows, newRow(rows)])}
      >
        {t('addProduct')}
      </Button>
    </div>
  );
}
