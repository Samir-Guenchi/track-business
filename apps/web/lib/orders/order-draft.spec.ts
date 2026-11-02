import { CreateOrderRequestSchema } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import {
  codAmountOf,
  emptyDraft,
  toCreateRequest,
  withKnownCustomer,
  type OrderDraft,
} from './order-draft';

const filled = (): OrderDraft => ({
  ...emptyDraft(),
  phone: '0550 12 34 56',
  name: 'Amina Test',
  wilayaCode: 16,
  communeId: 1601,
  address: 'Cité test',
  items: [{ key: 'a', name: 'Robe', quantity: 2, unitPrice: 2500 }],
});

describe('order draft', () => {
  it('builds a request the orders contract accepts', () => {
    const parsed = CreateOrderRequestSchema.safeParse(toCreateRequest(filled(), 400));
    expect(parsed.success).toBe(true);
    expect(parsed.data).toMatchObject({ shippingFee: 400, customer: { phone: '+213550123456' } });
  });

  it('computes the amount to collect with the quoted fee, an override and a discount', () => {
    expect(codAmountOf(filled(), 400)).toBe(5400);
    expect(codAmountOf({ ...filled(), shippingFeeOverride: 0, discount: 500 }, 400)).toBe(4500);
  });

  it('drops the address for stop-desk delivery and requires the desk', () => {
    const request = toCreateRequest({ ...filled(), deliveryType: 'stopdesk' }, 300);
    expect(request['customer']).toMatchObject({ address: undefined });
    expect(CreateOrderRequestSchema.safeParse(request).success).toBe(false);
  });

  it('fills a known customer without overwriting what was typed', () => {
    const previous = {
      name: 'Old',
      phone: '+213550123456',
      phone2: null,
      wilayaCode: 31,
      communeId: 3101,
      address: 'Rue X',
    };
    const draft = withKnownCustomer({ ...emptyDraft(), name: 'Typed' }, previous);
    expect(draft).toMatchObject({
      name: 'Typed',
      wilayaCode: 31,
      communeId: 3101,
      address: 'Rue X',
    });
  });
});
