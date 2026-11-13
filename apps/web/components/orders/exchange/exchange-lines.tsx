'use client';

import { Input } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import type { ExchangeDraft, ExchangeDraftLine } from '../../../lib/orders/exchange-draft';

interface Props {
  readonly draft: ExchangeDraft;
  readonly onChange: (draft: ExchangeDraft) => void;
}

const toNumber = (value: string) => Math.max(0, Math.floor(Number(value) || 0));

function LineFields({
  line,
  patch,
}: {
  readonly line: ExchangeDraftLine;
  readonly patch: (next: Partial<ExchangeDraftLine>) => void;
}) {
  const t = useTranslations('orders.exchange');
  return (
    <div className="grid gap-2 ps-6 sm:grid-cols-[5rem_1fr_8rem]">
      <Input
        type="number"
        label={t('quantity')}
        min={1}
        max={line.maxQuantity}
        value={line.quantity}
        onChange={(event) =>
          patch({
            quantity: Math.min(line.maxQuantity, Math.max(1, toNumber(event.currentTarget.value))),
          })
        }
      />
      <Input
        label={t('replacement')}
        value={line.replacement}
        maxLength={120}
        required
        onChange={(event) => patch({ replacement: event.currentTarget.value })}
      />
      <Input
        type="number"
        label={t('priceDifference')}
        min={0}
        value={line.priceDifference}
        onChange={(event) => patch({ priceDifference: toNumber(event.currentTarget.value) })}
      />
    </div>
  );
}

/** Tick what comes back, and say what goes out instead. */
export function ExchangeLines({ draft, onChange }: Props) {
  const patchLine = (index: number) => (next: Partial<ExchangeDraftLine>) =>
    onChange({
      ...draft,
      lines: draft.lines.map((line, at) => (at === index ? { ...line, ...next } : line)),
    });
  return (
    <ul className="flex flex-col gap-3">
      {draft.lines.map((line, index) => (
        <li key={line.itemId} className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={line.selected}
              onChange={(event) => patchLine(index)({ selected: event.currentTarget.checked })}
            />
            {line.name} × {line.maxQuantity}
          </label>
          {line.selected && <LineFields line={line} patch={patchLine(index)} />}
        </li>
      ))}
    </ul>
  );
}
