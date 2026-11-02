'use client';

import type { DeliveryFollowup, FollowupDecision } from '@trackecom/contracts';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import type { Locale } from '../../i18n/routing';
import { useDecideFollowup, useFollowups } from '../../lib/followups/followup-queries';
import { useWilayas, wilayaLabel } from '../../lib/geo/geo-queries';
import { useErrorMessage } from '../auth/use-error-message';
import { useFollowupFilters } from './use-followup-filters';

/** State of the failed-delivery page: filters, the list, decisions and their messages. */
export function useFollowupsPage() {
  const t = useTranslations('followups');
  const { filters, setFilters } = useFollowupFilters();
  const list = useFollowups(filters);
  const decide = useDecideFollowup();
  const errorMessage = useErrorMessage();
  const [saved, setSaved] = useState<string | null>(null);
  const onDecide = (item: DeliveryFollowup, decision: FollowupDecision, stopDeskId?: string) =>
    decide.mutate(
      { id: item.id, body: { decision, ...(stopDeskId ? { stopDeskId } : {}) } },
      { onSuccess: () => setSaved(t('saved', { ref: item.orderRef })) },
    );
  const failure = list.error ?? decide.error;
  return {
    filters,
    setFilters,
    list,
    items: list.data?.pages.flatMap((page) => page.items) ?? [],
    pendingId: decide.isPending ? decide.variables.id : null,
    onDecide,
    saved,
    error: failure ? errorMessage(failure) : null,
    wilayaName: useWilayaName(),
  };
}

function useWilayaName() {
  const locale = useLocale() as Locale;
  const wilayas = useWilayas().data?.items ?? [];
  return (code: number) => {
    const wilaya = wilayas.find((item) => item.code === code);
    return wilaya ? wilayaLabel(wilaya, locale) : String(code);
  };
}
