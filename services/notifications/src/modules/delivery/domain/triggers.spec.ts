import { describe, expect, it } from 'vitest';
import { MAX_ATTEMPTS, orderTrigger, parcelTrigger, retryDelayMs } from './triggers.js';

describe('triggers', () => {
  it('maps the order and parcel moves customers hear about', () => {
    expect(orderTrigger('confirmed')).toBe('order_confirmed');
    expect(orderTrigger('cancelled')).toBeNull();
    expect(parcelTrigger('out_for_delivery')).toBe('out_for_delivery');
    expect(parcelTrigger('returned')).toBe('parcel_returned');
    expect(parcelTrigger('in_transit')).toBeNull();
  });

  it('waits longer after each failed try, then gives up', () => {
    expect([1, 2, 3].map(retryDelayMs)).toEqual([60_000, 300_000, 1_800_000]);
    expect(retryDelayMs(MAX_ATTEMPTS)).toBeNull();
  });
});
