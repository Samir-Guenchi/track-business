'use client';

import type { DeliveryFollowup, FollowupDecision } from '@trackecom/contracts';
import { Button, Input } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface DecisionActionsProps {
  readonly item: DeliveryFollowup;
  readonly pending: boolean;
  readonly onDecide: (decision: FollowupDecision, stopDeskId?: string) => void;
}

/** Three choices; the stop-desk one asks for the desk code inline. */
export function DecisionActions({ item, pending, onDecide }: DecisionActionsProps) {
  const t = useTranslations('followups');
  const [askingDesk, setAskingDesk] = useState(false);
  if (askingDesk) {
    return (
      <StopDeskForm
        initial={item.stopDeskId ?? ''}
        pending={pending}
        onSubmit={(desk) => onDecide('switch_to_stopdesk', desk)}
        onCancel={() => setAskingDesk(false)}
      />
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" disabled={pending} onClick={() => onDecide('reattempt')}>
        {t('decision.reattempt')}
      </Button>
      <Button size="sm" variant="secondary" disabled={pending} onClick={() => setAskingDesk(true)}>
        {t('decision.switch_to_stopdesk')}
      </Button>
      <Button size="sm" variant="danger" disabled={pending} onClick={() => onDecide('return')}>
        {t('decision.return')}
      </Button>
    </div>
  );
}

interface StopDeskFormProps {
  readonly initial: string;
  readonly pending: boolean;
  readonly onSubmit: (desk: string) => void;
  readonly onCancel: () => void;
}

function StopDeskForm({ initial, pending, onSubmit, onCancel }: StopDeskFormProps) {
  const t = useTranslations('followups');
  const [desk, setDesk] = useState(initial);
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (desk.trim()) onSubmit(desk.trim());
      }}
    >
      <Input
        label={t('stopDesk')}
        value={desk}
        onChange={(event) => setDesk(event.currentTarget.value)}
        autoFocus
      />
      <Button type="submit" size="sm" loading={pending}>
        {t('confirmStopDesk')}
      </Button>
      <Button variant="ghost" size="sm" onClick={onCancel}>
        {t('cancel')}
      </Button>
    </form>
  );
}
