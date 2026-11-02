'use client';

import type { FormProduct, PublicOrderForm } from '@trackecom/contracts';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '../../i18n/routing';
import { formatDzd } from '../../lib/format';
import type { CodForm } from './use-cod-form';

interface Props {
  readonly form: PublicOrderForm;
  readonly state: CodForm;
}

/** Which product, which variant, how many. */
export function ProductFields({ form, state }: Props) {
  const t = useTranslations('orderForm');
  const product = form.products.find((item) => item.id === state.fields.productId);
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="tk-field__label pb-2">{t('product')}</legend>
      {form.products.map((item) => (
        <ProductOption key={item.id} product={item} state={state} />
      ))}
      <div className="flex gap-3">
        {product && product.variants.length > 0 && (
          <VariantField variants={product.variants} state={state} />
        )}
        <QuantityField max={form.maxQuantity} state={state} />
      </div>
    </fieldset>
  );
}

function ProductOption({
  product,
  state,
}: {
  readonly product: FormProduct;
  readonly state: CodForm;
}) {
  const locale = useLocale() as Locale;
  return (
    <label className="flex items-center gap-3 rounded-panel border border-border bg-surface p-3">
      <input
        type="radio"
        name="product"
        checked={state.fields.productId === product.id}
        onChange={() => state.patch({ productId: product.id, variant: '' })}
      />
      <span className="flex-1 font-medium">{product.name}</span>
      <span className="font-semibold">{formatDzd(product.unitPrice, locale)}</span>
    </label>
  );
}

function VariantField({
  variants,
  state,
}: {
  readonly variants: readonly string[];
  readonly state: CodForm;
}) {
  const t = useTranslations('orderForm');
  return (
    <label className="tk-field flex-1">
      <span className="tk-field__label">{t('variant')}</span>
      <select
        className="tk-input"
        required
        value={state.fields.variant}
        onChange={(event) => state.patch({ variant: event.currentTarget.value })}
      >
        <option value="">{t('chooseVariant')}</option>
        {variants.map((variant) => (
          <option key={variant}>{variant}</option>
        ))}
      </select>
    </label>
  );
}

function QuantityField({ max, state }: { readonly max: number; readonly state: CodForm }) {
  const t = useTranslations('orderForm');
  return (
    <label className="tk-field w-28">
      <span className="tk-field__label">{t('quantity')}</span>
      <select
        className="tk-input"
        value={state.fields.quantity}
        onChange={(event) => state.patch({ quantity: Number(event.currentTarget.value) })}
      >
        {Array.from({ length: max }, (_, index) => index + 1).map((count) => (
          <option key={count} value={count}>
            {count}
          </option>
        ))}
      </select>
    </label>
  );
}
