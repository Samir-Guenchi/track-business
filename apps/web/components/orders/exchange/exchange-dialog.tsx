'use client';

import type { Order } from '@trackecom/contracts';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@trackecom/ui';
import { Repeat } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { useRouter } from '../../../i18n/navigation';
import type { Locale } from '../../../i18n/routing';
import { formatDzd } from '../../../lib/format';
import {
  exchangeAmount,
  initialExchangeDraft,
  toExchangeRequest,
} from '../../../lib/orders/exchange-draft';
import { useCreateExchange } from '../../../lib/orders/order-queries';
import { FormAlert } from '../../auth/form-alert';
import { useErrorMessage } from '../../auth/use-error-message';
import { ExchangeDelivery } from './exchange-delivery';
import { ExchangeLines } from './exchange-lines';

/** The dialog's state: the draft, the request it makes, and sending it. */
function useExchangeForm({ order, wanted, onCreated }: ExchangeDialogProps) {
  const router = useRouter();
  const create = useCreateExchange();
  const [draft, setDraft] = useState(() => initialExchangeDraft(order, wanted));
  const request = toExchangeRequest(draft);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!request) return;
    create.mutate(
      { id: order.id, body: request },
      {
        onSuccess: (exchange) =>
          onCreated ? onCreated(exchange.id) : router.push(`/orders/${exchange.id}`),
      },
    );
  };
  return { draft, setDraft, request, submit, create };
}

interface ExchangeDialogProps {
  readonly order: Order;
  /** What the customer asked for in a return request (#201), added to each replacement. */
  readonly wanted?: string | null;
  /** Called with the new order instead of opening it (the return-request queue). */
  readonly onCreated?: (exchangeId: string) => void;
}

/** "Échanger" on a delivered order (#138): one new order, the old items collected on delivery. */
export function ExchangeDialog(props: ExchangeDialogProps) {
  const t = useTranslations('orders.exchange');
  const locale = useLocale() as Locale;
  const { draft, setDraft, request, submit, create } = useExchangeForm(props);
  const errorMessage = useErrorMessage();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <Repeat size={14} aria-hidden />
          {t('open')}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={t('close')}>
        <DialogTitle>{t('title')}</DialogTitle>
        <DialogDescription>{t('description')}</DialogDescription>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <ExchangeLines draft={draft} onChange={setDraft} />
          <ExchangeDelivery draft={draft} onChange={setDraft} />
          <p className="text-sm font-medium">
            {t('collectAmount', { amount: formatDzd(exchangeAmount(draft), locale) })}
          </p>
          <FormAlert message={create.isError ? errorMessage(create.error) : null} />
          <Button type="submit" disabled={!request || create.isPending}>
            {t('submit')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
