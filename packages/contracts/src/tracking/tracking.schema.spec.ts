import { describe, expect, it } from 'vitest';
import { ORDER_STATUS_FOR_PARCEL, PARCEL_STATUSES } from './parcel-status.js';
import { PublicTrackingResponseSchema } from './tracking.schema.js';

const AFTER_SHIPPING = [
  'in_transit',
  'out_for_delivery',
  'delivered',
  'failed_attempt',
  'returning',
  'returned',
];

describe('tracking contract', () => {
  it('only moves orders into after-shipping statuses', () => {
    const targets = new Set(PARCEL_STATUSES.map((status) => ORDER_STATUS_FOR_PARCEL[status]));

    expect(
      [...targets].filter((status) => status !== null && !AFTER_SHIPPING.includes(status)),
    ).toEqual([]);
  });

  it('keeps personal data off the public page', () => {
    const withPhone = {
      status: 'in_transit',
      carrier: 'yalidine',
      trackingNumber: 'YAL-1',
      events: [],
      phone: '+213555000000',
    };

    expect(PublicTrackingResponseSchema.safeParse(withPhone).success).toBe(false);
  });
});
