import { describe, expect, it } from 'vitest';
import { expectedFees } from './expected-fees.js';

const row = (fromWilaya: number, price: number, returnFee = 200) => ({
  fromWilaya,
  toWilaya: 31,
  deliveryType: 'home',
  price,
  returnFee,
});
const route = { trackingNumber: 'T1', toWilayaCode: 31, deliveryType: 'home' as const };

describe('expectedFees', () => {
  it('reads the delivery and return fee for the destination and type', () => {
    expect(expectedFees(route, [row(16, 700)])).toMatchObject({ deliveryFee: 700, returnFee: 200 });
  });

  it('keeps a fee when every origin agrees, drops it when they differ', () => {
    const result = expectedFees(route, [row(16, 700, 200), row(9, 800, 200)]);
    expect(result).toMatchObject({ deliveryFee: null, returnFee: 200 });
  });

  it('knows nothing without a matching row', () => {
    expect(expectedFees({ ...route, deliveryType: 'stopdesk' }, [row(16, 700)])).toMatchObject({
      deliveryFee: null,
      returnFee: null,
    });
  });
});
