import type { ExternalOrder } from '@trackecom/connectors';

/** A made-up shop order that imports cleanly unless `change` breaks it. */
export const shopOrder = (id: string, change: Partial<ExternalOrder> = {}): ExternalOrder => ({
  externalId: id,
  name: `#${id}`,
  createdAt: new Date(),
  updatedAt: new Date(),
  currency: 'DZD',
  customer: {
    name: 'Client Test',
    phone: '0555 00 00 47',
    address: 'Rue des tests',
    city: 'Bab Ezzouar',
    province: '16 - Alger',
    zip: null,
  },
  items: [{ name: 'Robe', sku: null, quantity: 1, unitPrice: 2500 }],
  shippingFee: 600,
  discount: 0,
  note: null,
  cancelled: false,
  ...change,
});

/** The same order with the customer's province or phone replaced. */
export const withCustomer = (id: string, customer: Partial<ExternalOrder['customer']>) => {
  const order = shopOrder(id);
  return { ...order, customer: { ...order.customer, ...customer } };
};
