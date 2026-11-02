import type { CreateOrderFormInput, DeliveryType, OrderForm } from '@trackecom/contracts';

export interface ProductDraft {
  readonly id: string;
  readonly name: string;
  readonly unitPrice: string;
  /** Comma-separated, e.g. "S, M, L". */
  readonly variants: string;
}

export interface FormDraft {
  readonly name: string;
  readonly title: string;
  readonly products: readonly ProductDraft[];
  readonly deliveryTypes: readonly DeliveryType[];
  readonly maxQuantity: number;
  readonly accent: string;
}

export const emptyProduct: ProductDraft = { id: '', name: '', unitPrice: '', variants: '' };

export const emptyDraft: FormDraft = {
  name: '',
  title: '',
  products: [emptyProduct],
  deliveryTypes: ['home', 'stopdesk'],
  maxQuantity: 5,
  accent: '#1f5c4a',
};

export function draftFromForm(form: OrderForm): FormDraft {
  return {
    name: form.name,
    title: form.title,
    products: form.products.map((product) => ({
      id: product.id,
      name: product.name,
      unitPrice: String(product.unitPrice),
      variants: product.variants.join(', '),
    })),
    deliveryTypes: form.deliveryTypes,
    maxQuantity: form.maxQuantity,
    accent: form.theme.accent,
  };
}

/** "Sac en cuir noir" -> "sac-en-cuir-noir"; Arabic names fall back to "produit-2". */
export function productIdOf(name: string, index: number): string {
  const slug = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return slug || `produit-${index + 1}`;
}

/** The request body; the server validates it again. */
export function requestOf(draft: FormDraft): CreateOrderFormInput {
  return {
    name: draft.name.trim(),
    title: draft.title.trim(),
    products: draft.products.map((product, index) => ({
      id: product.id || productIdOf(product.name, index),
      name: product.name.trim(),
      unitPrice: Number(product.unitPrice),
      variants: product.variants
        .split(',')
        .map((variant) => variant.trim())
        .filter(Boolean),
    })),
    deliveryTypes: [...draft.deliveryTypes],
    maxQuantity: draft.maxQuantity,
    theme: { accent: draft.accent },
  };
}

/** The line a seller pastes into a landing page. */
export function embedSnippet(appOrigin: string, key: string, locale: string): string {
  return `<script src="${appOrigin}/embed/order-form.js" data-form="${key}" data-locale="${locale}" async></script>`;
}
