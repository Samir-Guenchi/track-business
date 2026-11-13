'use client';

import { Button } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { ChoiceForm } from './choice-form';
import { RequestList } from './request-list';
import { type DeliveryChoicesState, useDeliveryChoices } from './use-delivery-choices';

const panel = 'flex flex-col gap-4 rounded-panel border border-border bg-surface p-5 shadow-panel';

function ChoiceButtons({ state }: { readonly state: DeliveryChoicesState }) {
  const t = useTranslations('deliveryChoices');
  const { choices, open } = state;
  if (!choices) return null;
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {choices.kinds.map((kind) => (
          <Button
            key={kind}
            variant={open === kind ? 'primary' : 'secondary'}
            size="sm"
            aria-expanded={open === kind}
            onClick={() => state.pick(open === kind ? null : kind)}
          >
            {t(`kinds.${kind}`)}
          </Button>
        ))}
      </div>
      {open && (
        <ChoiceForm kind={open} choices={choices} sending={state.sending} onSend={state.send} />
      )}
    </>
  );
}

function Feedback({ state }: { readonly state: DeliveryChoicesState }) {
  const t = useTranslations('deliveryChoices');
  const limitReached =
    (state.choices?.kinds.length ?? 0) > 0 && state.choices?.remainingToday === 0;
  return (
    <>
      {state.error && (
        <p role="alert" className="text-sm text-stamp">
          {t(`errors.${state.error}`)}
        </p>
      )}
      {state.sent && (
        <p role="status" className="text-sm text-tape-dark">
          {t('sent')}
        </p>
      )}
      {limitReached && <p className="text-sm text-muted">{t('limitReached')}</p>}
    </>
  );
}

/**
 * "Not home that day?" (#136): the customer picks another day, a stop-desk, a fixed address or
 * a call time before the courier leaves. Hidden once nothing can change and nothing was asked.
 */
export function DeliveryChoicesPanel({ code }: { readonly code: string }) {
  const t = useTranslations('deliveryChoices');
  const state = useDeliveryChoices(code);
  const { choices } = state;
  if (!choices || (choices.kinds.length === 0 && choices.requests.length === 0)) return null;
  const canAsk = choices.kinds.length > 0 && choices.remainingToday > 0;
  return (
    <section className={panel} aria-labelledby="choices-title">
      <h2 id="choices-title" className="text-lg font-semibold">
        {t('title')}
      </h2>
      {canAsk && <ChoiceButtons state={state} />}
      <Feedback state={state} />
      <RequestList requests={choices.requests} />
    </section>
  );
}
