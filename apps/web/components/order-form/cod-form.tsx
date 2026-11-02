'use client';

import type { PublicOrderForm, Wilaya } from '@trackecom/contracts';
import { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';
import { CustomerFields } from './customer-fields';
import { DeliveryFields } from './delivery-fields';
import { OrderSummary } from './order-summary';
import { ProductFields } from './product-fields';
import { ThankYou } from './thank-you';
import { useCodForm } from './use-cod-form';
import { useFrameHeight } from './use-frame-height';

interface CodFormProps {
  readonly form: PublicOrderForm;
  readonly wilayas: readonly Wilaya[];
}

/** The customer's COD order form (#134), on its own page or inside a landing page's iframe. */
export function CodFormView({ form, wilayas }: CodFormProps) {
  const t = useTranslations('orderForm');
  const state = useCodForm(form);
  useFrameHeight();
  if (state.done) return <ThankYou order={state.done} />;
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void state.submit();
  };
  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate={false}>
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">{form.title}</h1>
        <p className="text-sm text-muted">{t('cod')}</p>
      </header>
      <ProductFields form={form} state={state} />
      <CustomerFields state={state} />
      <DeliveryFields form={form} wilayas={wilayas} state={state} />
      <OrderSummary totals={state.totals} />
      {state.error && (
        <p role="alert" className="rounded-panel bg-stamp/10 p-3 text-sm text-stamp">
          {t(`errors.${state.error}`)}
        </p>
      )}
      <button
        type="submit"
        className="tk-button"
        data-variant="primary"
        data-size="lg"
        style={{ backgroundColor: form.theme.accent }}
        disabled={state.sending}
      >
        {t('submit')}
      </button>
    </form>
  );
}
