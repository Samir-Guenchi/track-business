'use client';

import { Button } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { useCustomerLookup } from '../../../lib/orders/customer-lookup';
import { withKnownCustomer } from '../../../lib/orders/order-draft';
import type { DraftControls } from './use-order-draft';

/** Shows what the store already knows about this number: past orders and the blacklist. */
export function PhoneLookup({ controls }: { readonly controls: DraftControls }) {
  const t = useTranslations('orders.new');
  const { history, blacklistEntry } = useCustomerLookup(controls.draft.phone);
  const previous = history?.lastCustomer;
  return (
    <>
      {blacklistEntry && (
        <p
          role="alert"
          className="rounded-control border border-stamp px-3 py-2 text-sm text-stamp"
        >
          {t('blacklisted', { reason: t(`blacklistReason.${blacklistEntry.reason}`) })}
        </p>
      )}
      {history && previous && (
        <div className="flex flex-wrap items-center gap-3 rounded-control border border-border px-3 py-2 text-sm">
          <span>
            {t('knownCustomer', {
              count: history.count,
              delivered: history.delivered,
              returned: history.returned,
            })}
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => controls.setDraft((draft) => withKnownCustomer(draft, previous))}
          >
            {t('useDetails')}
          </Button>
        </div>
      )}
    </>
  );
}
