import { describe, expect, it } from 'vitest';
import { priceChoice } from './form-pricing.js';
import type { OrderFormRecord } from './order-form.js';
import { DeliveryUnavailableError, FormProductError } from './order-form.errors.js';
import { screenSubmission } from './submission-screen.js';

const clean = { attemptsFromIp: 0, ordersFromPhone: 0, sameProductRecently: false };

describe('screenSubmission', () => {
  it('lets a first order through', () => {
    expect(screenSubmission(undefined, clean)).toBeNull();
    expect(screenSubmission('  ', clean)).toBeNull();
  });

  it('refuses bots, floods and repeats in that order', () => {
    expect(screenSubmission('http://spam', { ...clean, attemptsFromIp: 9 })).toBe('spam');
    expect(screenSubmission(undefined, { ...clean, attemptsFromIp: 5 })).toBe('rate_limited');
    expect(screenSubmission(undefined, { ...clean, ordersFromPhone: 3 })).toBe('rate_limited');
    expect(screenSubmission(undefined, { ...clean, sameProductRecently: true })).toBe('duplicate');
  });
});

const form = {
  products: [
    { id: 'sac', name: 'Sac', unitPrice: 3000, variants: ['S', 'M'] },
    { id: 'cap', name: 'Casquette', unitPrice: 1200, variants: [] },
  ],
  deliveryTypes: ['home'],
  maxQuantity: 3,
} as unknown as OrderFormRecord;
const prices = {
  items: [{ wilayaCode: 16, deliveryType: 'home' as const, price: 400 }],
  freeShippingFrom: 6000,
};
const choice = {
  productId: 'sac',
  variant: 'M',
  quantity: 1,
  wilayaCode: 16,
  deliveryType: 'home' as const,
};

describe('priceChoice', () => {
  it('prices the item and the delivery, free above the threshold', () => {
    expect(priceChoice(form, choice, prices)).toMatchObject({
      itemName: 'Sac (M)',
      subtotal: 3000,
      shippingFee: 400,
    });
    expect(priceChoice(form, { ...choice, quantity: 2 }, prices).shippingFee).toBe(0);
  });

  it('takes the order without a fee when prices are unknown', () => {
    expect(
      priceChoice(form, { ...choice, productId: 'cap', variant: undefined }, null).shippingFee,
    ).toBeNull();
  });

  it('refuses what the form does not offer', () => {
    expect(() => priceChoice(form, { ...choice, variant: 'XL' }, prices)).toThrow(FormProductError);
    expect(() => priceChoice(form, { ...choice, quantity: 4 }, prices)).toThrow(FormProductError);
    expect(() => priceChoice(form, { ...choice, wilayaCode: 33 }, prices)).toThrow(
      DeliveryUnavailableError,
    );
    expect(() => priceChoice(form, { ...choice, deliveryType: 'stopdesk' }, prices)).toThrow(
      DeliveryUnavailableError,
    );
  });
});
