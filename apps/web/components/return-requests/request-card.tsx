'use client';

import type { SellerReturnRequest } from '@trackecom/contracts';
import { Badge } from '@trackecom/ui';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';
import type { Locale } from '../../i18n/routing';
import { formatDateTime } from '../../lib/format';
import { DecisionActions } from './decision-actions';

type Props = { readonly item: SellerReturnRequest };

function CardHeader({ item }: Props) {
  const t = useTranslations('returnRequests');
  const locale = useLocale() as Locale;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Badge variant={item.kind === 'exchange' ? 'info' : 'warning'}>
          {t(`kind.${item.kind}`)}
        </Badge>
        <Link
          href={`/orders/${item.orderId}`}
          className="font-medium text-tape underline"
          dir="ltr"
        >
          {item.trackingNumber}
        </Link>
        <span className="text-sm text-muted" dir="ltr">
          {item.carrier}
        </span>
      </div>
      <span className="text-sm text-muted">{formatDateTime(new Date(item.createdAt), locale)}</span>
    </div>
  );
}

function Decided({ item }: Props) {
  const t = useTranslations('returnRequests');
  return (
    <p className="text-sm">
      <span className="font-medium">{t(`state.${item.state}`)}</span>
      {item.newOrderId && (
        <Link href={`/orders/${item.newOrderId}`} className="ms-2 text-tape underline">
          {t('openExchange')}
        </Link>
      )}
    </p>
  );
}

/** One customer request: what they want, why, and the decision. */
export function RequestCard({ item }: Props) {
  const t = useTranslations('returnRequests');
  const reason = useTranslations('returnRequest.reason');
  return (
    <li className="flex flex-col gap-3 rounded-panel border border-border bg-surface p-4 shadow-panel">
      <CardHeader item={item} />
      <p className="text-sm">
        {reason(item.reason)}
        {item.wanted && (
          <span className="font-medium"> · {t('wanted', { wanted: item.wanted })}</span>
        )}
      </p>
      {item.note && <p className="text-sm text-muted">{item.note}</p>}
      {item.state === 'pending' ? <DecisionActions item={item} /> : <Decided item={item} />}
    </li>
  );
}
