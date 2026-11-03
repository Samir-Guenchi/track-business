'use client';

import { Skeleton } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { useWilayas } from '../../lib/geo/geo-queries';
import { useStorePrices } from '../../lib/pricing/pricing-queries';
import { FormAlert } from '../auth/form-alert';
import { useErrorMessage } from '../auth/use-error-message';
import { SettingsTabs } from '../settings/settings-tabs';
import { DeliveryPricesForm } from './delivery-prices-form';

/** Settings > Delivery prices. */
export function DeliveryPricesPage() {
  const t = useTranslations('deliveryPrices');
  const prices = useStorePrices();
  const wilayas = useWilayas();
  const errorMessage = useErrorMessage();
  const error = prices.error ?? wilayas.error;
  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted">{t('description')}</p>
      </header>
      <SettingsTabs />
      <div className="rounded-panel border border-border bg-surface p-4 sm:p-6">
        {(prices.isPending || wilayas.isPending) && <Skeleton className="h-96" />}
        {error && <FormAlert message={errorMessage(error)} />}
        {prices.data && wilayas.data && (
          <DeliveryPricesForm prices={prices.data} wilayas={wilayas.data.items} />
        )}
      </div>
    </section>
  );
}
