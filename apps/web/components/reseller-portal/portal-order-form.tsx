'use client';

import type { ResellerProduct, Wilaya } from '@trackecom/contracts';
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

/** Send a customer's order to the supplier. */
export function PortalOrderForm({ code, catalogue, wilayas }: Props) {
  const t = useTranslations('resellerPortal');
  const form = usePortalOrder(code, catalogue);
  const errorKey = form.error?.replace('resellers.', '') ?? null;
  return (
    <form className="flex flex-col gap-3" onSubmit={form.onSubmit} noValidate>
      <PortalCustomerFields draft={form.draft} patch={form.patch} wilayas={wilayas} />
      <PortalProductFields
        draft={form.draft}
        patch={form.patch}
        catalogue={catalogue}
        product={form.product}
      />
      <FormAlert
        message={
          errorKey ? t(t.has(`errors.${errorKey}`) ? `errors.${errorKey}` : 'errors.generic') : null
        }
      />
      <FormAlert
        message={
          form.created
            ? t('sent', {
                ref: form.created.ref,
                codAmount: form.created.codAmount,
                margin: form.created.margin,
              })
            : null
        }
        tone="success"
      />
      <Button type="submit" loading={form.sending}>
        {t('form.submit')}
      </Button>
    </form>
  );
}
