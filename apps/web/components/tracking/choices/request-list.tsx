'use client';

import type { PublicDeliveryRequest } from '@trackecom/contracts';
import { useTranslations } from 'next-intl';
import { useRequestSummary } from './use-request-summary';

/** What the customer already asked, so a second visit does not ask twice. */
export function RequestList({ requests }: { readonly requests: readonly PublicDeliveryRequest[] }) {
  const t = useTranslations('deliveryChoices');
  const summary = useRequestSummary();
  if (requests.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-sm font-semibold text-muted">{t('yourRequests')}</h3>
      <ul className="flex flex-col gap-1 text-sm">
        {requests.map((each) => (
          <li key={each.createdAt} className="flex justify-between gap-2">
            <span dir="auto">{summary(each.request)}</span>
            <span className="shrink-0 text-muted">{t(`state.${each.state}`)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
