'use client';

import {
  type CreateReturnRequest,
  type ReturnRequestKind,
  type ReturnRequestReason,
  ReturnRequestReasonSchema,
} from '@trackecom/contracts';
import { Button, Input } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';

interface Props {
  readonly sending: boolean;
  readonly onSend: (body: CreateReturnRequest) => void;
}

const field = 'flex flex-col gap-1 text-sm';

function KindChoice(props: { value: ReturnRequestKind; onChange: (k: ReturnRequestKind) => void }) {
  const t = useTranslations('returnRequest');
  return (
    <fieldset className="flex flex-wrap gap-4 text-sm">
      <legend className="sr-only">{t('kindLabel')}</legend>
      {(['exchange', 'return'] as const).map((value) => (
        <label key={value} className="flex items-center gap-2">
          <input
            type="radio"
            name="kind"
            checked={props.value === value}
            onChange={() => props.onChange(value)}
          />
          {t(`kind.${value}`)}
        </label>
      ))}
    </fieldset>
  );
}

function ReasonSelect(props: {
  value: ReturnRequestReason;
  onChange: (r: ReturnRequestReason) => void;
}) {
  const t = useTranslations('returnRequest');
  return (
    <label className={field}>
      {t('reasonLabel')}
      <select
        className="rounded-control border border-border bg-surface px-2 py-2"
        value={props.value}
        onChange={(event) =>
          props.onChange(ReturnRequestReasonSchema.parse(event.currentTarget.value))
        }
      >
        {ReturnRequestReasonSchema.options.map((value) => (
          <option key={value} value={value}>
            {t(`reason.${value}`)}
          </option>
        ))}
      </select>
    </label>
  );
}

interface TextFieldProps {
  readonly label: string;
  readonly value: string;
  readonly maxLength: number;
  readonly placeholder?: string;
  readonly onChange: (value: string) => void;
}

function TextField({ label, onChange, ...input }: TextFieldProps) {
  return (
    <label className={field}>
      {label}
      <Input {...input} onChange={(event) => onChange(event.currentTarget.value)} />
    </label>
  );
}

/** Exchange or return, why, and what the customer wants instead. */
export function ReturnRequestForm({ sending, onSend }: Props) {
  const t = useTranslations('returnRequest');
  const [kind, setKind] = useState<ReturnRequestKind>('exchange');
  const [reason, setReason] = useState<ReturnRequestReason>('wrong_size');
  const [wanted, setWanted] = useState('');
  const [note, setNote] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSend({ kind, reason, ...(kind === 'exchange' && wanted ? { wanted } : {}), note });
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <KindChoice value={kind} onChange={setKind} />
      <ReasonSelect value={reason} onChange={setReason} />
      {kind === 'exchange' && (
        <TextField
          label={t('wantedLabel')}
          value={wanted}
          maxLength={120}
          placeholder={t('wantedPlaceholder')}
          onChange={setWanted}
        />
      )}
      <TextField label={t('noteLabel')} value={note} maxLength={500} onChange={setNote} />
      <Button type="submit" disabled={sending}>
        {t('send')}
      </Button>
    </form>
  );
}
