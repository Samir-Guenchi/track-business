'use client';

import type { ResellerProduct } from '@trackecom/contracts';
import { Badge, Button } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import {
  useResellerCatalogue,
  useUpdateResellerProduct,
} from '../../lib/resellers/resellers-queries';
import { FormAlert } from '../auth/form-alert';
import { useErrorMessage } from '../auth/use-error-message';
import { ProductForm } from './product-form';

function ProductRow({ product }: { readonly product: ResellerProduct }) {
  const t = useTranslations('resellers.catalogue');
  const money = useTranslations('resellers');
  const update = useUpdateResellerProduct(product.id);
  const toggle = () =>
    update.mutate({
      name: product.name,
      supplierPrice: product.supplierPrice,
      ...(product.minPrice === null ? {} : { minPrice: product.minPrice }),
      active: !product.active,
    });
  return (
    <li className="studio-product">
      <div className="studio-product__id">
        <span
          className={`studio-product__name${product.active ? '' : ' studio-product__name--paused'}`}
        >
          {product.name}
        </span>
        {!product.active && <Badge variant="neutral">{t('paused')}</Badge>}
      </div>
      <div className="studio-product__prices">
        <span className="studio-product__price">
          <span>{t('supplierShort')}</span>
          <strong>{money('dinars', { amount: product.supplierPrice })}</strong>
        </span>
        <span className="studio-product__price">
          <span>{t('minimumShort')}</span>
          <strong>
            {product.minPrice === null ? '—' : money('dinars', { amount: product.minPrice })}
          </strong>
        </span>
      </div>
      <Button size="sm" variant="ghost" loading={update.isPending} onClick={toggle}>
        {t(product.active ? 'pause' : 'resume')}
      </Button>
    </li>
  );
}

/** What resellers can sell, at the supplier price and the lowest selling price allowed. */
export function CatalogueSection() {
  const t = useTranslations('resellers.catalogue');
  const catalogue = useResellerCatalogue();
  const errorMessage = useErrorMessage();
  const items = catalogue.data?.items ?? [];
  return (
    <section className="studio-panel studio-catalogue" aria-labelledby="reseller-catalogue">
      <header className="studio-panel__head">
        <div>
          <p className="studio-eyebrow">{t('eyebrow')}</p>
          <h2 id="reseller-catalogue">{t('title')}</h2>
          <p>{t('description')}</p>
        </div>
        <span className="studio-section__count">{t('count', { count: items.length })}</span>
      </header>
      <FormAlert
        className="studio-catalogue__alert"
        message={catalogue.isError ? errorMessage(catalogue.error) : null}
      />
      {catalogue.isPending && <p className="studio-catalogue__empty">{t('loading')}</p>}
      {catalogue.isSuccess && items.length === 0 && (
        <p className="studio-catalogue__empty">{t('empty')}</p>
      )}
      <ul className="studio-products" aria-label={t('title')}>
        {items.map((product) => (
          <ProductRow key={product.id} product={product} />
        ))}
      </ul>
      <div className="studio-catalogue__form">
        <ProductForm />
      </div>
    </section>
  );
}
