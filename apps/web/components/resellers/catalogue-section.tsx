'use client';

import type { ResellerProduct } from '@trackecom/contracts';
import { Button } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import {
  useResellerCatalogue,
  useUpdateResellerProduct,
} from '../../lib/resellers/resellers-queries';
import { ProductForm } from './product-form';

function ProductRow({ product }: { readonly product: ResellerProduct }) {
  const t = useTranslations('resellers.catalogue');
  const update = useUpdateResellerProduct(product.id);
  const toggle = () =>
    update.mutate({
      name: product.name,
      supplierPrice: product.supplierPrice,
      ...(product.minPrice === null ? {} : { minPrice: product.minPrice }),
      active: !product.active,
    });
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-t border-border py-2 text-sm">
      <span className={product.active ? 'font-medium' : 'text-muted line-through'}>
        {product.name}
      </span>
      <span>{t('prices', { supplier: product.supplierPrice, min: product.minPrice ?? 0 })}</span>
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
  const items = catalogue.data?.items ?? [];
  return (
    <section className="flex flex-col gap-3 rounded-panel border border-border bg-surface p-5 shadow-panel">
      <h2 className="text-lg font-semibold">{t('title')}</h2>
      <p className="text-sm text-muted">{t('description')}</p>
      {catalogue.isSuccess && items.length === 0 && (
        <p className="text-sm text-muted">{t('empty')}</p>
      )}
      <ul aria-label={t('title')}>
        {items.map((product) => (
          <ProductRow key={product.id} product={product} />
        ))}
      </ul>
      <ProductForm />
    </section>
  );
}
