'use client';

import { Button, Input } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { useDropParcel } from '../../lib/pickup-points/pickup-queries';
import { FormAlert } from '../auth/form-alert';
import { usePickupError } from './use-pickup-error';

/** The courier left a parcel at the shop: type or scan its tracking number. */
export function DropForm({ pointId }: { readonly pointId: string }) {
  const t = useTranslations('pickupPoints.drop');
  const [trackingNumber, setTrackingNumber] = useState('');
  const drop = useDropParcel(pointId);
  const errorOf = usePickupError();
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (trackingNumber.trim().length < 3) return;
    drop.mutate(trackingNumber.trim(), { onSuccess: () => setTrackingNumber('') });
  };
  return (
    <form className="flex flex-col gap-2" onSubmit={onSubmit} noValidate>
      <div className="flex flex-wrap items-end gap-2">
        <Input
          label={t('label')}
          hint={t('hint')}
          value={trackingNumber}
          dir="ltr"
          onChange={(event) => setTrackingNumber(event.currentTarget.value)}
        />
        <Button type="submit" variant="secondary" loading={drop.isPending}>
          {t('submit')}
        </Button>
      </div>
      <FormAlert message={errorOf(drop.error)} />
      <FormAlert message={drop.isSuccess ? t('done') : null} tone="success" />
    </form>
  );
}
