import { describe, expect, it } from 'vitest';
import { type ExpectedFee, auditFees } from './fee-audit.js';

type Charges = { shippingFee: number; returnFee?: number; codAmount?: number };
const line = (
  trackingNumber: string,
  { shippingFee, returnFee = 0, codAmount = 3000 }: Charges,
) => ({
  trackingNumber,
  codAmount,
  shippingFee,
  returnFee,
});
const rate = (trackingNumber: string, deliveryFee: number | null, returnFee: number | null) =>
  [
    trackingNumber,
    { trackingNumber, toWilayaCode: 31, deliveryType: 'home', deliveryFee, returnFee },
  ] as [string, ExpectedFee];

describe('auditFees', () => {
  it('flags a delivery fee above the rate card', () => {
    const result = auditFees(
      [line('A', { shippingFee: 900 }), line('B', { shippingFee: 700 })],
      new Map([rate('A', 700, 250), rate('B', 700, 250)]),
    );

    expect(result).toEqual({
      checked: 2,
      overchargedTotal: 200,
      issues: [
        {
          trackingNumber: 'A',
          issue: 'delivery_fee_above_rate',
          charged: 900,
          expected: 700,
          overcharge: 200,
        },
      ],
    });
  });

  it('flags a return fee above the card on a returned parcel', () => {
    const result = auditFees(
      [line('A', { shippingFee: 700, returnFee: 400, codAmount: 0 })],
      new Map([rate('A', 700, 250)]),
    );

    expect(result.issues).toEqual([
      {
        trackingNumber: 'A',
        issue: 'return_fee_above_rate',
        charged: 400,
        expected: 250,
        overcharge: 150,
      },
    ]);
  });

  it('flags a return fee on a delivered parcel and a parcel charged twice, without rate cards', () => {
    const result = auditFees(
      [
        line('A', { shippingFee: 700, returnFee: 250 }),
        line('B', { shippingFee: 700 }),
        line('B', { shippingFee: 700 }),
      ],
      null,
    );

    expect(result.issues.map((issue) => [issue.trackingNumber, issue.issue])).toEqual([
      ['A', 'return_fee_on_delivered'],
      ['B', 'charged_twice'],
    ]);
    expect(result).toMatchObject({ checked: 0, overchargedTotal: 950 });
  });

  it('skips the comparison when the rate card is unclear', () => {
    expect(
      auditFees([line('A', { shippingFee: 5000 })], new Map([rate('A', null, null)])).issues,
    ).toEqual([]);
  });
});
