'use client';

import { ResellerProductInputSchema } from '@trackecom/contracts';
import { Button, Input } from '@trackecom/ui';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';
import { useAddResellerProduct } from '../../lib/resellers/resellers-queries';
import { FormAlert } from '../auth/form-alert';
import { useErrorMessage } from '../auth/use-error-message';

const EMPTY = { name: '', supplierPrice: '', minPrice: '' };
const digits = (value: string) => value.replace(/\D/g, '');

function useProductForm() {
  const [draft, setDraft] = useState(EMPTY);
  const [invalid, setInvalid] = useState(false);
  const add = useAddResellerProduct();
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = ResellerProductInputSchema.safeParse({
      name: draft.name,
      supplierPrice: draft.supplierPrice === '' ? Number.NaN : Number(draft.supplierPrice),
      ...(draft.minPrice ? { minPrice: Number(draft.minPrice) } : {}),
    });
    setInvalid(!parsed.success);
    if (parsed.success) add.mutate(parsed.data, { onSuccess: () => setDraft(EMPTY) });
  };
  const set = (key: keyof typeof EMPTY, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));
  return { draft, invalid, add, onSubmit, set };
}

/** Offer one more product to resellers. */
export function ProductForm() {
  const t = useTranslations('resellers.catalogue');
  const errorMessage = useErrorMessage();
  const { draft, invalid, add, onSubmit, set } = useProductForm();
  return (
    <form className="studio-product-form" onSubmit={onSubmit} noValidate>
      <Input
        label={t('name')}
        value={draft.name}
        onChange={(event) => set('name', event.currentTarget.value)}
      />
      <Input
        label={t('supplierPrice')}
        value={draft.supplierPrice}
        inputMode="numeric"
        onChange={(event) => set('supplierPrice', digits(event.currentTarget.value))}
      />
      <Input
        label={t('minPrice')}
        value={draft.minPrice}
        inputMode="numeric"
        onChange={(event) => set('minPrice', digits(event.currentTarget.value))}
      />
      <Button type="submit" variant="secondary" loading={add.isPending}>
        {t('add')}
      </Button>
      <div className="studio-product-form__alerts">
        <FormAlert message={invalid ? t('invalid') : null} />
        <FormAlert message={add.isError ? errorMessage(add.error) : null} />
      </div>
    </form>
  );
}
