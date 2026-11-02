import type { OrderForm } from '@trackecom/contracts';
import type { OrderFormRecord } from '../domain/order-form.js';

export const toOrderForm = (form: OrderFormRecord): OrderForm => ({
  id: form.id,
  key: form.key,
  name: form.name,
  title: form.title,
  products: form.products.map((product) => ({ ...product, variants: [...product.variants] })),
  deliveryTypes: [...form.deliveryTypes],
  maxQuantity: form.maxQuantity,
  theme: { accent: form.accent },
  enabled: form.enabled,
  createdAt: form.createdAt.toISOString(),
  updatedAt: form.updatedAt.toISOString(),
});
