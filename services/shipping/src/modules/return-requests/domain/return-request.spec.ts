import { describe, expect, it } from 'vitest';
import { insideWindow, returnDeadline, stateAfter } from './return-request.js';

const delivered = { status: 'delivered', at: new Date('2026-11-01T10:00:00Z') };

describe('return window', () => {
  it('opens on delivery for seven days', () => {
    expect(returnDeadline(delivered)?.toISOString()).toBe('2026-11-08T10:00:00.000Z');
    expect(insideWindow(delivered, new Date('2026-11-08T09:59:00Z'))).toBe(true);
    expect(insideWindow(delivered, new Date('2026-11-08T10:01:00Z'))).toBe(false);
  });

  it('stays closed while the parcel is not delivered', () => {
    const moving = { status: 'in_transit', at: new Date('2026-11-01T10:00:00Z') };
    expect(returnDeadline(moving)).toBeNull();
    expect(insideWindow(null, new Date())).toBe(false);
  });
});

describe('stateAfter', () => {
  it('maps each decision to its state', () => {
    expect(stateAfter({ decision: 'accept_return' })).toBe('accepted_return');
    expect(stateAfter({ decision: 'refuse', message: 'Article porté' })).toBe('refused');
  });
});
