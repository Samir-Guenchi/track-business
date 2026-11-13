import { describe, expect, it } from 'vitest';
import { PickupPointInputSchema, ReleaseParcelSchema } from './pickup-point.schema.js';

describe('pickup point contracts', () => {
  it('normalises the shop phone and defaults hours and active', () => {
    const point = PickupPointInputSchema.parse({
      name: 'Superette du centre',
      wilayaCode: 11,
      communeId: 1101,
      address: 'Rue principale',
      phone: '0555 00 00 01',
      capacity: 30,
      feePerParcel: 100,
    });
    expect(point).toMatchObject({ phone: '+213555000001', hours: '', active: true });
  });

  it('takes only a six-digit code', () => {
    expect(ReleaseParcelSchema.safeParse({ code: '12345', cashCollected: 0 }).success).toBe(false);
    expect(ReleaseParcelSchema.safeParse({ code: '123456', cashCollected: 0 }).success).toBe(true);
  });
});
