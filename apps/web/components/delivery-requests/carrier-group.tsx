'use client';

import type { DeliveryRequest } from '@trackecom/contracts';
import { Button } from '@trackecom/ui';
import { Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { type CarrierGroup, changeListText } from '../../lib/delivery-requests/carrier-groups';
import { useRequestSummary } from '../tracking/choices/use-request-summary';
import { RequestRow } from './request-row';

const panel = 'flex flex-col gap-2 rounded-panel border border-border bg-surface p-4 shadow-panel';

/** One carrier's changes, with the text to paste in its chat or e-mail. */
export function CarrierGroupCard({ group }: { readonly group: CarrierGroup }) {
  const t = useTranslations('deliveryRequests');
  const summary = useRequestSummary();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const text = changeListText(group, (item: DeliveryRequest) => summary(item.request));
    await navigator.clipboard.writeText(text);
    setCopied(true);
  };
  return (
    <section className={panel} aria-label={group.carrier}>
      <header className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">
          {group.carrier} · {t('count', { count: group.items.length })}
        </h2>
        <Button size="sm" variant="secondary" onClick={() => void copy()}>
          <Copy size={14} aria-hidden />
          {copied ? t('copied') : t('copy')}
        </Button>
      </header>
      <ul className="flex flex-col divide-y divide-border">
        {group.items.map((item) => (
          <RequestRow key={item.id} item={item} linkToOrder />
        ))}
      </ul>
    </section>
  );
}
