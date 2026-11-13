'use client';

import type { ResellerProduct } from '@trackecom/contracts';
import { useTranslations } from 'next-intl';
import { SelectField, TextField } from './portal-inputs';
import type { PortalDraft } from './use-portal-order';

function MarginPreview({ margin }: { readonly margin: number }) {
  const t = useTranslations('resellerPortal.form');
  const money = useTranslations('resellerPortal');
  return (
    <dl className="studio-margin" data-tone={margin < 0 ? 'negative' : 'positive'}>
      <div>
        <dt>{t('marginLabel')}</dt>
        <dd>{money('dinars', { amount: margin })}</dd>
      </div>
      <small>{t('marginNote')}</small>
    </dl>
  );
}

interface Props {
  readonly draft: PortalDraft;
  readonly patch: (change: Partial<PortalDraft>) => void;
  readonly catalogue: readonly ResellerProduct[];
  readonly product: ResellerProduct | null;
}

/** The product, quantity and the reseller's selling price, with the margin it gives. */
export function PortalProductFields({ draft, patch, catalogue, product }: Props) {
  const t = useTranslations('resellerPortal.form');
  const floor = product ? Math.max(product.supplierPrice, product.minPrice ?? 0) : 0;
  const margin = product
    ? (Number(draft.sellingPrice) - product.supplierPrice) * Number(draft.quantity || 0)
    : 0;
  const options = catalogue.map((item) => ({
    value: item.id,
    label: t('productOption', { name: item.name, price: item.supplierPrice }),
  }));
  return (
    <>
      <SelectField
        label={t('product')}
        value={draft.productId}
        options={options}
        onChange={(value) => patch({ productId: value })}
      />
      <div className="studio-field-grid studio-field-grid--two">
        <TextField
          label={t('quantity')}
          value={draft.quantity}
          kind="number"
          onChange={(value) => patch({ quantity: value })}
        />
        <TextField
          label={t('sellingPrice')}
          value={draft.sellingPrice}
          kind="number"
          hint={product ? t('floor', { floor }) : undefined}
          onChange={(value) => patch({ sellingPrice: value })}
        />
      </div>
      {product && draft.sellingPrice && <MarginPreview margin={margin} />}
    </>
  );
}
