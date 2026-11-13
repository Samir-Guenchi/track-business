'use client';

import type { PickupParcel } from '@trackecom/contracts';
import { Button, Input } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { useReleaseParcel } from '../../lib/pickup-points/pickup-queries';
import { FormAlert } from '../auth/form-alert';
import { usePickupError } from './use-pickup-error';

interface Props {
  readonly pointId: string;
  readonly parcel: PickupParcel;
}

/** The customer is at the shop: their six-digit code and the cash taken release the parcel. */
export function ReleaseForm({ pointId, parcel }: Props) {
  const t = useTranslations('pickupPoints.release');
  const [code, setCode] = useState('');
  const [cash, setCash] = useState('');
  const release = useReleaseParcel(pointId);
  const errorOf = usePickupError();
  const ready = /^\d{6}$/.test(code) && /^\d+$/.test(cash);
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    const body = { code, cashCollected: Number(cash) };
    release.mutate({ shipmentId: parcel.shipmentId, body });
  };
  return (
    <form className="flex flex-col gap-2" onSubmit={onSubmit} noValidate>
      <div className="flex flex-wrap items-end gap-2">
        <Input
          label={t('code')}
          value={code}
          inputMode="numeric"
          maxLength={6}
          dir="ltr"
          onChange={(event) => setCode(event.currentTarget.value.replace(/\D/g, ''))}
        />
        <Input
          label={t('cash')}
          value={cash}
          inputMode="numeric"
          dir="ltr"
          onChange={(event) => setCash(event.currentTarget.value.replace(/\D/g, ''))}
        />
        <Button type="submit" size="sm" disabled={!ready} loading={release.isPending}>
          {t('submit')}
        </Button>
      </div>
      <FormAlert message={errorOf(release.error)} />
    </form>
  );
}
