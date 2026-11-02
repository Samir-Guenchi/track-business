'use client';

import { DeliveryTypeSchema } from '@trackecom/contracts';
import { Input } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { DetailCard } from '../detail/detail-card';
import { type DraftSectionProps, fieldError } from './field-error';
import type { DraftControls } from './use-order-draft';

interface DeliveryFieldsProps extends DraftSectionProps {
  readonly controls: DraftControls;
}

export function DeliveryFields({ controls, errors }: DeliveryFieldsProps) {
  const t = useTranslations('orders.new');
  const { draft, patch } = controls;
  return (
    <DetailCard title={t('delivery')}>
      <fieldset className="flex gap-4">
        <legend className="sr-only">{t('delivery')}</legend>
        {DeliveryTypeSchema.options.map((type) => (
          <label key={type} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="deliveryType"
              value={type}
              checked={draft.deliveryType === type}
              onChange={() => patch({ deliveryType: type })}
            />
            {t(type)}
          </label>
        ))}
      </fieldset>
      {draft.deliveryType === 'home' ? (
        <Input
          label={t('address')}
          value={draft.address}
          onChange={(event) => patch({ address: event.currentTarget.value })}
          {...fieldError(errors, 'address', t('errors.address'))}
        />
      ) : (
        <Input
          label={t('stopDesk')}
          value={draft.stopDeskId}
          onChange={(event) => patch({ stopDeskId: event.currentTarget.value })}
          {...fieldError(errors, 'stopDesk', t('errors.stopDesk'))}
        />
      )}
    </DetailCard>
  );
}
