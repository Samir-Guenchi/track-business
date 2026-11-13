import { describe, expect, it } from 'vitest';
import { availableKinds, dateWindow, type ParcelFacts, refusalOf } from './delivery-choices.js';

const home: ParcelFacts = { status: 'in_transit', deliveryType: 'home', stopDeskNearby: true };
const now = new Date('2026-11-02T23:30:00Z');

describe('delivery choices', () => {
  it('offers every choice to a home parcel on its way', () => {
    expect(availableKinds(home)).toEqual([
      'reschedule',
      'call_after',
      'fix_address',
      'switch_stopdesk',
    ]);
  });

  it('offers no address or stop-desk change for a stop-desk parcel, nor a desk where none is', () => {
    expect(availableKinds({ ...home, deliveryType: 'stopdesk' })).toEqual([
      'reschedule',
      'call_after',
    ]);
    expect(availableKinds({ ...home, stopDeskNearby: false })).not.toContain('switch_stopdesk');
  });

  it('closes once the courier is out or the parcel is final', () => {
    expect(availableKinds({ ...home, status: 'out_for_delivery' })).toEqual([]);
    expect(availableKinds({ ...home, status: 'delivered' })).toEqual([]);
    expect(availableKinds({ ...home, status: 'failed_attempt' })).toHaveLength(4);
  });

  it('counts days on the Algiers calendar', () => {
    expect(dateWindow(now)).toEqual({ earliest: '2026-11-04', latest: '2026-11-10' });
  });

  it('says why a request is refused', () => {
    const ctx = { parcel: home, now, usedToday: 0 };
    expect(refusalOf({ kind: 'reschedule', date: '2026-11-04' }, ctx)).toBeNull();
    expect(refusalOf({ kind: 'reschedule', date: '2026-11-03' }, ctx)).toBe('bad_date');
    expect(refusalOf({ kind: 'switch_stopdesk' }, { ...ctx, usedToday: 3 })).toBe('too_many');
    const closed = { ...ctx, parcel: { ...home, status: 'delivered' as const } };
    expect(refusalOf({ kind: 'call_after', time: '18:00' }, closed)).toBe('closed');
  });
});
