'use client';

import type { ResellerOrderCreated, ResellerProduct, Wilaya } from '@trackecom/contracts';
import { Button } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { FormAlert } from '../auth/form-alert';
import { PortalCustomerFields } from './portal-customer-fields';
import { PortalProductFields } from './portal-product-fields';
import { usePortalOrder } from './use-portal-order';

interface Props {
  readonly code: string;
  readonly catalogue: readonly ResellerProduct[];
  readonly wilayas: readonly Wilaya[];
}

type PortalForm = ReturnType<typeof usePortalOrder>;

function OrderSections({
  form,
  catalogue,
  wilayas,
}: {
  readonly form: PortalForm;
  readonly catalogue: readonly ResellerProduct[];
  readonly wilayas: readonly Wilaya[];
}) {
  const t = useTranslations('resellerPortal');
  return (
    <div className="studio-order-grid">
      <section className="studio-order-section">
        <h3>{t('form.customerSection')}</h3>
        <div className="studio-field-grid studio-field-grid--two">
          <PortalCustomerFields draft={form.draft} patch={form.patch} wilayas={wilayas} />
        </div>
      </section>
      <section className="studio-order-section">
        <h3>{t('form.orderSection')}</h3>
        <div className="studio-field-grid">
          <PortalProductFields
            draft={form.draft}
            patch={form.patch}
            catalogue={catalogue}
            product={form.product}
          />
        </div>
      </section>
    </div>
  );
}

function Alerts({
  errorKey,
  created,
}: {
  readonly errorKey: string | null;
  readonly created: ResellerOrderCreated | null;
}) {
  const t = useTranslations('resellerPortal');
  const error = errorKey
    ? t(t.has(`errors.${errorKey}`) ? `errors.${errorKey}` : 'errors.generic')
    : null;
  return (
    <>
      <FormAlert className="studio-alert" message={error} />
      <FormAlert
        className="studio-alert"
        message={
          created
            ? t('sent', {
                ref: created.ref,
                codAmount: created.codAmount,
                margin: created.margin,
              })
            : null
        }
        tone="success"
      />
    </>
  );
}

/** Send a customer's order to the supplier. */
export function PortalOrderForm({ code, catalogue, wilayas }: Props) {
  const t = useTranslations('resellerPortal');
  const form = usePortalOrder(code, catalogue);
  const errorKey = form.error?.replace('resellers.', '') ?? null;
  return (
    <form className="studio-order-form" onSubmit={form.onSubmit} noValidate>
      <OrderSections form={form} catalogue={catalogue} wilayas={wilayas} />
      <Alerts errorKey={errorKey} created={form.created} />
      <div className="studio-submit-row">
        <Button type="submit" size="lg" loading={form.sending}>
          {t('form.submit')}
        </Button>
        <span className="studio-submit-note">{t('form.note')}</span>
      </div>
    </form>
  );
}
