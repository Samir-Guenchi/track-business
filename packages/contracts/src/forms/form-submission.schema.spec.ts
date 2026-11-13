import { describe, expect, it } from 'vitest';
import { SubmitFormOrderRequestSchema } from './form-submission.schema.js';

const base = {
  name: 'Client Test',
  phone: '0555 00 01 34',
  wilayaCode: 16,
  communeId: 1601,
  deliveryType: 'home',
  address: 'Rue A',
  productId: 'sac-noir',
  quantity: 1,
};

describe('form submission contract', () => {
  it('normalises the phone and accepts a home order with an address', () => {
    const body = SubmitFormOrderRequestSchema.parse(base);
    expect(body.phone).toMatch(/^\+213/);
  });

  it('needs an address for home delivery and a desk for stop-desk', () => {
    const noAddress = { ...base, address: undefined };
    expect(SubmitFormOrderRequestSchema.safeParse(noAddress).success).toBe(false);
    const desk = { ...noAddress, deliveryType: 'stopdesk' };
    expect(SubmitFormOrderRequestSchema.safeParse(desk).success).toBe(false);
    expect(SubmitFormOrderRequestSchema.safeParse({ ...desk, stopDeskId: 'sd-16' }).success).toBe(
      true,
    );
  });

  it('refuses unknown fields so a page cannot send a store id', () => {
    expect(SubmitFormOrderRequestSchema.safeParse({ ...base, storeId: 'x' }).success).toBe(false);
  });
});
