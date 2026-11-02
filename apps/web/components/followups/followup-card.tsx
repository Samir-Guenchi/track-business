'use client';

import type { DeliveryFollowup, FollowupDecision } from '@trackecom/contracts';
import { Badge } from '@trackecom/ui';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '../../i18n/navigation';
import type { Locale } from '../../i18n/routing';
import { formatDateTime } from '../../lib/format';
import { isOverdue } from '../../lib/followups/followup-filters';
import { DecisionActions } from './decision-actions';

interface FollowupCardProps {
  readonly item: DeliveryFollowup;
  readonly wilayaName: string;
  readonly pending: boolean;
  readonly onDecide: (
    item: DeliveryFollowup,
    decision: FollowupDecision,
    stopDeskId?: string,
  ) => void;
}

export function FollowupCard({ item, wilayaName, pending, onDecide }: FollowupCardProps) {
  const t = useTranslations('followups');
  const locale = useLocale() as Locale;
  const overdue = isOverdue(item, new Date());
  return (
    <li className="flex flex-col gap-3 rounded-panel border border-border bg-surface p-4 shadow-panel">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/orders/${item.orderId}`}
          className="font-semibold text-tape underline"
          dir="ltr"
        >
          {item.orderRef}
        </Link>
        <span>{item.customerName}</span>
        <span className="text-sm text-muted">· {wilayaName}</span>
        <Badge variant={item.reason === 'refused' ? 'danger' : 'warning'}>
          {t(`reason.${item.reason}`)}
        </Badge>
        {overdue && <Badge variant="danger">{t('overdueBadge')}</Badge>}
      </div>
      <p className="text-sm text-muted">
        <span dir="ltr">
          {item.carrier} {item.trackingNumber}
        </span>{' '}
        · {t('attempts', { count: item.attempts })} ·{' '}
        {t('due', { time: formatDateTime(new Date(item.dueAt), locale) })}
      </p>
      <FollowupState item={item} pending={pending} onDecide={onDecide} />
    </li>
  );
}

function FollowupState({ item, pending, onDecide }: Omit<FollowupCardProps, 'wilayaName'>) {
  const t = useTranslations('followups');
  if (item.status === 'closed' && item.outcome)
    return <p className="text-sm font-medium">{t(`outcome.${item.outcome}`)}</p>;
  return (
    <>
      {item.decision && (
        <p className="text-sm font-medium">
          {t('decided', { decision: t(`decision.${item.decision}`) })}
          {item.stopDeskId && <span dir="ltr"> ({item.stopDeskId})</span>}
        </p>
      )}
      <DecisionActions
        item={item}
        pending={pending}
        onDecide={(decision, desk) => onDecide(item, decision, desk)}
      />
    </>
  );
}
