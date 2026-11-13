'use client';

import type { PickupPoint } from '@trackecom/contracts';
import { Button, Input } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { useSavePoint } from '../../lib/pickup-points/pickup-queries';
import {
  draftOf,
  emptyDraft,
  type PointDraft,
  toPointInput,
} from '../../lib/pickup-points/point-draft';
import { FormAlert } from '../auth/form-alert';
import { PlaceFields } from './place-fields';
import { usePickupError } from './use-pickup-error';

type TextField = 'name' | 'address' | 'phone' | 'hours' | 'capacity' | 'feePerParcel';
const NUMBERS: readonly TextField[] = ['capacity', 'feePerParcel'];

interface FieldProps {
  readonly name: TextField;
  readonly draft: PointDraft;
  readonly invalid: readonly string[];
  readonly patch: (change: Partial<PointDraft>) => void;
}

function TextInput({ name, draft, invalid, patch }: FieldProps) {
  const t = useTranslations('pickupPoints.form');
  return (
    <Input
      label={t(name)}
      value={draft[name]}
      {...(NUMBERS.includes(name) ? { inputMode: 'numeric' } : {})}
      {...(invalid.includes(name) ? { error: t('fix') } : {})}
      onChange={(event) => patch({ [name]: event.currentTarget.value })}
    />
  );
}

function usePointForm(point: PickupPoint | undefined, onDone: () => void) {
  const [draft, setDraft] = useState<PointDraft>(point ? draftOf(point) : emptyDraft);
  const [invalid, setInvalid] = useState<string[]>([]);
  const save = useSavePoint(point?.id);
  const patch = (change: Partial<PointDraft>) => setDraft((current) => ({ ...current, ...change }));
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const result = toPointInput(draft);
    if ('invalid' in result) return setInvalid(result.invalid);
    setInvalid([]);
    save.mutate(result.input, { onSuccess: onDone });
  };
  return { draft, invalid, save, patch, onSubmit };
}

interface Props {
  readonly point?: PickupPoint;
  readonly onDone: () => void;
}

/** Register or edit a partner shop. */
export function PointForm({ point, onDone }: Props) {
  const t = useTranslations('pickupPoints.form');
  const errorOf = usePickupError();
  const { draft, invalid, save, patch, onSubmit } = usePointForm(point, onDone);
  const field = (name: TextField) => (
    <TextInput name={name} draft={draft} invalid={invalid} patch={patch} />
  );
  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit} noValidate>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {field('name')}
        {field('phone')}
      </div>
      <PlaceFields draft={draft} patch={patch} invalid={invalid} />
      {field('address')}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {field('hours')}
        {field('capacity')}
        {field('feePerParcel')}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={draft.active}
          onChange={(event) => patch({ active: event.currentTarget.checked })}
        />
        {t('active')}
      </label>
      <FormAlert message={errorOf(save.error)} />
      <div className="flex gap-2">
        <Button type="submit" loading={save.isPending}>
          {t('save')}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          {t('cancel')}
        </Button>
      </div>
    </form>
  );
}
