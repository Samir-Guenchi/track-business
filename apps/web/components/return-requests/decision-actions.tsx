'use client';

import type { DecideReturnRequest, SellerReturnRequest } from '@trackecom/contracts';
import { Button, Input } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useOrder } from '../../lib/orders/order-queries';
import { useDecideReturnRequest } from '../../lib/return-requests/return-requests-queries';
import { FormAlert } from '../auth/form-alert';
import { useErrorMessage } from '../auth/use-error-message';
import { ExchangeDialog } from '../orders/exchange/exchange-dialog';

interface ExchangeProps {
  readonly item: SellerReturnRequest;
  readonly onCreated: (exchangeId: string) => void;
}

/** The exchange dialog of the original order, prefilled with what the customer asked for. */
function AcceptExchange({ item, onCreated }: ExchangeProps) {
  const order = useOrder(item.orderId);
  if (!order.data) return null;
  return <ExchangeDialog order={order.data} wanted={item.wanted} onCreated={onCreated} />;
}

interface ButtonsProps {
  readonly item: SellerReturnRequest;
  readonly message: string;
  readonly busy: boolean;
  readonly send: (body: DecideReturnRequest) => void;
}

function DecisionButtons({ item, message, busy, send }: ButtonsProps) {
  const t = useTranslations('returnRequests');
  const withMessage = message ? { message } : {};
  return (
    <div className="flex flex-wrap gap-2">
      {item.kind === 'exchange' && (
        <AcceptExchange
          item={item}
          onCreated={(newOrderId) =>
            send({ decision: 'accept_exchange', newOrderId, ...withMessage })
          }
        />
      )}
      <Button
        size="sm"
        variant="secondary"
        disabled={busy}
        onClick={() => send({ decision: 'accept_return', ...withMessage })}
      >
        {t('acceptReturn')}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={busy || !message}
        title={t('refuseHint')}
        onClick={() => send({ decision: 'refuse', message })}
      >
        {t('refuse')}
      </Button>
    </div>
  );
}

/** Accept as exchange (creates the exchange order), accept as return, or refuse with a message. */
export function DecisionActions({ item }: { readonly item: SellerReturnRequest }) {
  const t = useTranslations('returnRequests');
  const decide = useDecideReturnRequest();
  const errorMessage = useErrorMessage();
  const [message, setMessage] = useState('');
  return (
    <div className="flex flex-col gap-2">
      <Input
        value={message}
        maxLength={300}
        placeholder={t('messagePlaceholder')}
        aria-label={t('messageLabel')}
        onChange={(event) => setMessage(event.currentTarget.value)}
      />
      <DecisionButtons
        item={item}
        message={message.trim()}
        busy={decide.isPending}
        send={(body) => decide.mutate({ id: item.id, body })}
      />
      <FormAlert message={decide.isError ? errorMessage(decide.error) : null} />
    </div>
  );
}
