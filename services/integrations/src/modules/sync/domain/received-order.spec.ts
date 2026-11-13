import type { ExternalOrder } from '@trackecom/connectors';
import { describe, expect, it } from 'vitest';
import { cancellationOf, receivedOrderOf } from './received-order.js';

const order: ExternalOrder = {
  externalId: 'gid://shopify/Order/1',
  name: '#1001',
  createdAt: new Date('2026-11-01T08:00:00Z'),
  updatedAt: new Date('2026-11-01T08:00:00Z'),
  currency: 'DZD',
  customer: {
    name: 'Client Test',
    phone: '0555 00 00 01',
    address: 'Rue des tests',
    city: 'Bab Ezzouar',
    province: 'Alger',
    zip: null,
  },
  items: [{ name: 'Robe', sku: 'R-1', quantity: 2, unitPrice: 2500 }],
  shippingFee: 600,
  discount: 100,
  note: 'Appeler avant',
  cancelled: false,
};
const HERE = { wilayaCode: 16, communeId: 1621 };

describe('received order', () => {
  it('maps a placed order to the event orders reads', () => {
    const mapped = receivedOrderOf('shopify', order, HERE);

    expect(mapped).toMatchObject({
      ok: true,
      data: {
        externalName: '#1001',
        order: {
          customer: { phone: '0555 00 00 01', wilayaCode: 16, communeId: 1621 },
          items: [{ name: 'Robe', sku: 'R-1', quantity: 2, unitPrice: 2500 }],
          deliveryType: 'home',
          notes: 'Appeler avant',
        },
      },
    });
  });

  it.each([
    ['currency', { ...order, currency: 'EUR' }, HERE],
    ['phone', { ...order, customer: { ...order.customer, phone: '+33 6 12 34 56 78' } }, HERE],
    ['phone', { ...order, customer: { ...order.customer, phone: null } }, HERE],
    ['address', order, null],
    ['address', { ...order, customer: { ...order.customer, address: ' ' } }, HERE],
    ['invalid', { ...order, items: [] }, HERE],
  ] as const)('holds the order back for its %s', (problem, given, location) => {
    expect(receivedOrderOf('shopify', given, location)).toEqual({ ok: false, problem });
  });

  it('cancels with the shop id alone', () => {
    expect(cancellationOf('shopify', { ...order, cancelled: true })).toEqual({
      ok: true,
      data: {
        connector: 'shopify',
        externalId: order.externalId,
        externalName: '#1001',
        cancelled: true,
        order: null,
      },
    });
  });
});
