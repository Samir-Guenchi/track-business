import { describe, expect, it } from 'vitest';
import { eventKey } from './event-key.js';
import { isFinalStatus, nextPollAt } from './poll-schedule.js';

const now = new Date('2026-11-01T10:00:00Z');

describe('nextPollAt', () => {
  it('polls a parcel out for delivery within 15 minutes', () => {
    const next = nextPollAt('out_for_delivery', now);

    expect(next && next.getTime() - now.getTime()).toBeLessThanOrEqual(15 * 60_000);
  });

  it('polls a parcel in transit less often', () => {
    expect(nextPollAt('in_transit', now)?.getTime()).toBeGreaterThan(
      nextPollAt('out_for_delivery', now)?.getTime() ?? 0,
    );
  });

  it.each(['delivered', 'returned', 'cancelled'] as const)('stops polling once %s', (status) => {
    expect(nextPollAt(status, now)).toBeNull();
    expect(isFinalStatus(status)).toBe(true);
  });
});

describe('eventKey', () => {
  const scan = { carrierStatus: 'Livré', at: now, location: 'Oran' };

  it('is the same for the same scan received twice', () => {
    expect(eventKey({ ...scan, location: ' Oran ' })).toBe(eventKey(scan));
  });

  it('differs when the time or the label differs', () => {
    expect(eventKey({ ...scan, at: new Date(now.getTime() + 1000) })).not.toBe(eventKey(scan));
    expect(eventKey({ ...scan, carrierStatus: 'Retour' })).not.toBe(eventKey(scan));
  });
});
