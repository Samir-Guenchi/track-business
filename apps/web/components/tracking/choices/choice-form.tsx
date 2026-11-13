'use client';

import type {
  CreateDeliveryRequest,
  DeliveryChoices,
  DeliveryRequestKind,
} from '@trackecom/contracts';
import { Button } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { ChoiceFields, type ChoiceValues } from './choice-fields';

interface ChoiceFormProps {
  readonly kind: DeliveryRequestKind;
  readonly choices: DeliveryChoices;
  readonly sending: boolean;
  readonly onSend: (request: CreateDeliveryRequest) => void;
}

function requestOf(kind: DeliveryRequestKind, values: ChoiceValues): CreateDeliveryRequest {
  if (kind === 'reschedule') return { kind, date: values.date };
  if (kind === 'call_after') return { kind, time: values.time };
  if (kind === 'switch_stopdesk') return { kind };
  const landmark = values.landmark.trim();
  return { kind, address: values.address, ...(landmark ? { landmark } : {}) };
}

/** One open choice: its inputs and the send button. */
export function ChoiceForm({ kind, choices, sending, onSend }: ChoiceFormProps) {
  const t = useTranslations('deliveryChoices');
  const [values, setValues] = useState<ChoiceValues>({
    date: choices.earliestDate,
    time: '17:00',
    address: '',
    landmark: '',
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSend(requestOf(kind, values));
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-md bg-canvas p-3">
      <ChoiceFields
        kind={kind}
        choices={choices}
        values={values}
        onChange={(next) => setValues((current) => ({ ...current, ...next }))}
      />
      <Button type="submit" disabled={sending}>
        {t('send')}
      </Button>
    </form>
  );
}
