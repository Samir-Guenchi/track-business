'use client';

import { type ClaimCandidate, type ClaimReason, ClaimReasonSchema } from '@trackecom/contracts';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Input,
} from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { useOpenClaim } from '../../lib/claims/claims-queries';
import { useOrder } from '../../lib/orders/order-queries';
import { FormAlert } from '../auth/form-alert';
import { useErrorMessage } from '../auth/use-error-message';

const dinars = (value: string) => Math.max(0, Math.floor(Number(value) || 0));

/** The form's state; the declared value starts from the order subtotal once it loads. */
function useClaimForm(candidate: ClaimCandidate) {
  const order = useOrder(candidate.orderId);
  const open = useOpenClaim();
  const [reason, setReason] = useState<ClaimReason>(candidate.reason);
  const [value, setValue] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const declaredValue = value ?? order.data?.subtotal ?? 0;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = note.trim();
    open.mutate({
      shipmentId: candidate.shipmentId,
      reason,
      declaredValue,
      ...(trimmed ? { note: trimmed } : {}),
    });
  };
  return { reason, setReason, declaredValue, setValue, note, setNote, submit, open };
}

/** "Réclamer" on a candidate: reason, declared value and a note for the carrier. */
export function OpenClaimDialog({ candidate }: { readonly candidate: ClaimCandidate }) {
  const t = useTranslations('claims');
  const form = useClaimForm(candidate);
  const errorMessage = useErrorMessage();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          {t('open.button')}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={t('open.close')}>
        <DialogTitle>{t('open.title', { tracking: candidate.trackingNumber })}</DialogTitle>
        <DialogDescription>{t('open.description')}</DialogDescription>
        <form onSubmit={form.submit} className="flex flex-col gap-4">
          <ReasonField value={form.reason} onChange={form.setReason} />
          <Input
            type="number"
            min={0}
            label={t('open.value')}
            value={form.declaredValue}
            onChange={(event) => form.setValue(dinars(event.currentTarget.value))}
          />
          <Input
            label={t('open.note')}
            maxLength={1000}
            value={form.note}
            onChange={(event) => form.setNote(event.currentTarget.value)}
          />
          <FormAlert message={form.open.isError ? errorMessage(form.open.error) : null} />
          <Button type="submit" disabled={form.open.isPending}>
            {t('open.submit')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ReasonFieldProps {
  readonly value: ClaimReason;
  readonly onChange: (reason: ClaimReason) => void;
}

function ReasonField({ value, onChange }: ReasonFieldProps) {
  const t = useTranslations('claims');
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="pb-1 text-sm font-medium">{t('open.reason')}</legend>
      {ClaimReasonSchema.options.map((reason) => (
        <label key={reason} className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="reason"
            checked={value === reason}
            onChange={() => onChange(reason)}
          />
          {t(`reason.${reason}`)}
        </label>
      ))}
    </fieldset>
  );
}
