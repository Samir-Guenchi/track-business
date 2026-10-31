import { describe, expect, it } from 'vitest';
import { BulkOrdersRequestSchema, ListOrdersQuerySchema } from './order-actions.schema.js';
import { CreateOrderRequestSchema } from './order.schema.js';

const order = {
  customer: {
    name: 'Karim B.',
    phone: '0555 12 34 56',
    wilayaCode: 16,
    communeId: 1621,
    address: 'Cité 5 juillet, bloc 3',
  },
  items: [{ name: 'Robe kabyle', quantity: 1, unitPrice: 4500 }],
  deliveryType: 'home',
  shippingFee: 600,
};

describe('CreateOrderRequestSchema', () => {
  it('normalises the phone and fills defaults', () => {
    const parsed = CreateOrderRequestSchema.parse(order);

    expect(parsed.customer.phone).toBe('+213555123456');
    expect(parsed).toMatchObject({ source: 'manual', discount: 0, tags: [] });
  });

  it('needs an address for home delivery and a stop desk otherwise', () => {
    const noAddress = { ...order, customer: { ...order.customer, address: undefined } };

    expect(CreateOrderRequestSchema.safeParse(noAddress).success).toBe(false);
    expect(
      CreateOrderRequestSchema.safeParse({ ...noAddress, deliveryType: 'stopdesk' }).success,
    ).toBe(false);
    expect(
      CreateOrderRequestSchema.safeParse({
        ...noAddress,
        deliveryType: 'stopdesk',
        stopDeskId: 'sd-1',
      }).success,
    ).toBe(true);
  });

  it('rejects negative or fractional prices', () => {
    const items = [{ name: 'x', quantity: 1, unitPrice: 10.5 }];

    expect(CreateOrderRequestSchema.safeParse({ ...order, items }).success).toBe(false);
  });
});

describe('ListOrdersQuerySchema', () => {
  it('reads a comma-separated status list and coerces numbers', () => {
    const query = ListOrdersQuerySchema.parse({ status: 'to_confirm,postponed', wilayaCode: '31' });

    expect(query).toMatchObject({ status: ['to_confirm', 'postponed'], wilayaCode: 31, limit: 20 });
  });

  it('rejects an unknown status', () => {
    expect(ListOrdersQuerySchema.safeParse({ status: 'lost' }).success).toBe(false);
  });
});

describe('BulkOrdersRequestSchema', () => {
  it('validates each action by its own shape', () => {
    expect(
      BulkOrdersRequestSchema.safeParse({ action: 'add_tag', orderIds: ['a'], tag: 'VIP' }).success,
    ).toBe(true);
    expect(BulkOrdersRequestSchema.safeParse({ action: 'add_tag', orderIds: ['a'] }).success).toBe(
      false,
    );
  });
});
