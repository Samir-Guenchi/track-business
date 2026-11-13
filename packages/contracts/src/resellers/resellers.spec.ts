import { describe, expect, it } from 'vitest';
import { ResellerInputSchema, ResellerOrderRequestSchema } from './index.js';

const customer = { name: 'Client test', phone: '0555 00 00 01', wilayaCode: 16, communeId: 1601 };
const item = { productId: '19800000-0000-4000-8000-000000000001', quantity: 1, sellingPrice: 3500 };

describe('reseller contracts', () => {
  it('normalises the reseller phone and defaults to active', () => {
    expect(ResellerInputSchema.parse({ name: 'Revendeur', phone: '0555000001' })).toEqual({
      name: 'Revendeur',
      phone: '+213555000001',
      active: true,
    });
  });

  it('needs an address for home delivery', () => {
    const home = { customer, items: [item], deliveryType: 'home' };
    expect(ResellerOrderRequestSchema.safeParse(home).success).toBe(false);
    const withAddress = { ...home, customer: { ...customer, address: 'Rue test' } };
    expect(ResellerOrderRequestSchema.safeParse(withAddress).success).toBe(true);
  });
});
