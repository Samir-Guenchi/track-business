'use client';

import { Button, Input } from '@trackecom/ui';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ProductDraft } from '../../lib/forms/form-editor';
import type { FormEditorState } from './use-form-editor';

/** One row per product: name, price and its variants. */
export function ProductsEditor({ editor }: { readonly editor: FormEditorState }) {
  const t = useTranslations('forms.editor');
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="tk-field__label pb-2">{t('products')}</legend>
      {editor.draft.products.map((product, index) => (
        <ProductRow key={index} index={index} product={product} editor={editor} />
      ))}
      <Button variant="secondary" size="sm" className="self-start" onClick={editor.addProduct}>
        {t('addProduct')}
      </Button>
    </fieldset>
  );
}

interface RowProps {
  readonly index: number;
  readonly product: ProductDraft;
  readonly editor: FormEditorState;
}

function ProductRow({ index, product, editor }: RowProps) {
  const t = useTranslations('forms.editor');
  const set = (next: Partial<ProductDraft>) => editor.setProduct(index, next);
  return (
    <div className="grid grid-cols-1 gap-2 rounded-panel border border-border p-3 sm:grid-cols-[2fr_1fr_2fr_auto] sm:items-end">
      <Input
        label={t('productName')}
        required
        maxLength={120}
        value={product.name}
        onChange={(e) => set({ name: e.currentTarget.value })}
      />
      <Input
        label={t('price')}
        required
        inputMode="numeric"
        dir="ltr"
        value={product.unitPrice}
        onChange={(e) => set({ unitPrice: e.currentTarget.value.replace(/\D/g, '') })}
      />
      <Input
        label={t('variants')}
        {...(index === 0 ? { hint: t('variantsHint') } : {})}
        value={product.variants}
        onChange={(e) => set({ variants: e.currentTarget.value })}
      />
      <Button
        variant="ghost"
        size="sm"
        aria-label={t('removeProduct')}
        disabled={editor.draft.products.length === 1}
        onClick={() => editor.removeProduct(index)}
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
