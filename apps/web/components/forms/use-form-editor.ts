'use client';

import type { OrderForm } from '@trackecom/contracts';
import { useState } from 'react';
import {
  type FormDraft,
  type ProductDraft,
  draftFromForm,
  emptyDraft,
  emptyProduct,
  requestOf,
} from '../../lib/forms/form-editor';
import { useSaveOrderForm } from '../../lib/forms/forms-queries';
import { useErrorMessage } from '../auth/use-error-message';

/** Draft of a form being created or edited, and saving it. */
export function useFormEditor(form: OrderForm | null, onSaved: () => void) {
  const [draft, setDraft] = useState<FormDraft>(() => (form ? draftFromForm(form) : emptyDraft));
  const save = useSaveOrderForm();
  const errorMessage = useErrorMessage();
  const patch = (next: Partial<FormDraft>) => setDraft((current) => ({ ...current, ...next }));
  const setProduct = (index: number, next: Partial<ProductDraft>) =>
    patch({
      products: draft.products.map((product, i) =>
        i === index ? { ...product, ...next } : product,
      ),
    });
  return {
    draft,
    patch,
    setProduct,
    addProduct: () => patch({ products: [...draft.products, emptyProduct] }),
    removeProduct: (index: number) =>
      patch({ products: draft.products.filter((_, i) => i !== index) }),
    submit: () =>
      save.mutate(
        { id: form?.id ?? null, body: requestOf(draft), enabled: form?.enabled ?? true },
        { onSuccess: onSaved },
      ),
    saving: save.isPending,
    error: save.error ? errorMessage(save.error) : null,
  };
}

export type FormEditorState = ReturnType<typeof useFormEditor>;
