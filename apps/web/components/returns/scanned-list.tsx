'use client';

import { type ReturnCondition, ReturnConditionSchema } from '@trackecom/contracts';
import { Button } from '@trackecom/ui';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReceiveForm } from './use-receive-form';

/** The parcels scanned so far, newest on top, each with its condition. */
export function ScannedList({ form }: { readonly form: ReceiveForm }) {
  const t = useTranslations('returns');
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium" aria-live="polite">
        {t('receive.scanned', { count: form.rows.length })}
      </p>
      <ul className="flex flex-col divide-y divide-border rounded-panel border border-border">
        {form.rows.map((row) => (
          <li key={row.trackingNumber} className="flex items-center gap-3 px-3 py-2">
            <span className="flex-1 font-medium" dir="ltr">
              {row.trackingNumber}
            </span>
            <ConditionSelect
              trackingNumber={row.trackingNumber}
              condition={row.condition}
              onChange={(condition) => form.setCondition(row.trackingNumber, condition)}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={t('receive.remove', { number: row.trackingNumber })}
              onClick={() => form.remove(row.trackingNumber)}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface ConditionSelectProps {
  readonly trackingNumber: string;
  readonly condition: ReturnCondition;
  readonly onChange: (condition: ReturnCondition) => void;
}

function ConditionSelect({ trackingNumber, condition, onChange }: ConditionSelectProps) {
  const t = useTranslations('returns');
  return (
    <select
      className="tk-input w-40"
      aria-label={t('receive.condition', { number: trackingNumber })}
      value={condition}
      onChange={(event) => onChange(ReturnConditionSchema.parse(event.currentTarget.value))}
    >
      {ReturnConditionSchema.options.map((option) => (
        <option key={option} value={option}>
          {t(`condition.${option}`)}
        </option>
      ))}
    </select>
  );
}
