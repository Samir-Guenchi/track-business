'use client';

import type { DeliveryRequest } from '@trackecom/contracts';
import { Button } from '@trackecom/ui';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';
import type { Locale } from '../../i18n/routing';
import { useAnswerDeliveryRequest } from '../../lib/delivery-requests/delivery-requests-queries';
import { formatDateTime } from '../../lib/format';
import { useRequestSummary } from '../tracking/choices/use-request-summary';

interface RequestRowProps {
  readonly item: DeliveryRequest;
  /** On the change list, each row links to its order; on the order page it does not. */
  readonly linkToOrder?: boolean;
}

function Answer({ item }: { readonly item: DeliveryRequest }) {
  const t = useTranslations('deliveryRequests');
  const answer = useAnswerDeliveryRequest();
  if (item.state !== 'pending') {
    return <span className="text-sm text-muted">{t(`state.${item.state}`)}</span>;
  }
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={answer.isPending}
        onClick={() => answer.mutate({ id: item.id, state: 'sent' })}
      >
        {t('markSent')}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={answer.isPending}
        onClick={() => answer.mutate({ id: item.id, state: 'dismissed' })}
      >
        {t('dismiss')}
      </Button>
    </div>
  );
}

/** One customer request: what they asked, when, and the seller's answer. */
export function RequestRow({ item, linkToOrder = false }: RequestRowProps) {
  const summary = useRequestSummary();
  const locale = useLocale() as Locale;
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="flex flex-col gap-1 text-sm">
        <span className="font-medium" dir="auto">
          {summary(item.request)}
        </span>
        <span className="text-xs text-muted">
          {linkToOrder ? (
            <Link href={`/orders/${item.orderId}`} className="text-tape underline" dir="ltr">
              {item.trackingNumber}
            </Link>
          ) : (
            <span dir="ltr">{item.trackingNumber}</span>
          )}
          {' · '}
          {formatDateTime(new Date(item.createdAt), locale)}
        </span>
      </div>
      <Answer item={item} />
    </li>
  );
}
