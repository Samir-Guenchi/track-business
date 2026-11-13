'use client';

import { EmptyState, Skeleton } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { groupByCarrier } from '../../lib/delivery-requests/carrier-groups';
import { useDeliveryRequests } from '../../lib/delivery-requests/delivery-requests-queries';
import { FormAlert } from '../auth/form-alert';
import { useErrorMessage } from '../auth/use-error-message';
import { CarrierGroupCard } from './carrier-group';

/**
 * The daily change list (#136): what customers asked from their tracking link, per carrier, to
 * pass on until carriers take changes through their API.
 */
export function DeliveryRequestsPage() {
  const t = useTranslations('deliveryRequests');
  const requests = useDeliveryRequests({ state: 'pending' });
  const errorMessage = useErrorMessage();
  const groups = groupByCarrier(requests.data?.items ?? []);
  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted">{t('description')}</p>
      </header>
      <FormAlert message={requests.isError ? errorMessage(requests.error) : null} />
      {requests.isPending && <Skeleton className="h-40" />}
      {requests.isSuccess && groups.length === 0 && (
        <EmptyState title={t('empty.title')} description={t('empty.description')} />
      )}
      {groups.map((group) => (
        <CarrierGroupCard key={group.carrier} group={group} />
      ))}
    </section>
  );
}
