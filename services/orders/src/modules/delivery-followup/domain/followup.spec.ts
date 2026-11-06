import { describe, expect, it } from 'vitest';
import { FollowupClosedError } from './followup.errors.js';
import {
  DECISION_WINDOW_MS,
  closedBy,
  decide,
  openFollowup,
  reopenedByDispute,
  withAnotherAttempt,
} from './followup.js';

const base = {
  id: 'f1',
  storeId: 's1',
  orderId: 'o1',
  orderRef: 'TE-TEST01',
  customerName: 'Client Test',
  wilayaCode: 16,
  shipmentId: 'sh1',
  carrier: 'yalidine',
  trackingNumber: 'yal-TEST',
};
const at = new Date('2026-11-02T10:00:00Z');
const now = new Date('2026-11-02T10:05:00Z');
const opened = () => openFollowup(base, { reason: 'absent', at }, now);

describe('delivery follow-up', () => {
  it('opens with a decision window after the attempt', () => {
    const followup = opened();

    expect(followup).toMatchObject({ status: 'open', attempts: 1, reason: 'absent' });
    expect(followup.dueAt.getTime() - at.getTime()).toBe(DECISION_WINDOW_MS);
  });

  it('reopens on a newer attempt and ignores a late, older scan', () => {
    const decided = decide(opened(), { decision: 'reattempt', by: 'u1', at: now });
    const later = new Date('2026-11-03T11:00:00Z');

    expect(withAnotherAttempt(decided, { reason: 'phone_off', at: later }, later)).toMatchObject({
      status: 'open',
      attempts: 2,
      reason: 'phone_off',
    });
    expect(withAnotherAttempt(decided, { reason: 'absent', at }, later)).toBeNull();
  });

  it('closes with the outcome when the parcel ends', () => {
    expect(closedBy(opened(), 'delivered', now)).toMatchObject({
      status: 'closed',
      outcome: 'delivered',
    });
    expect(closedBy(opened(), 'returning', now)?.outcome).toBe('returned');
    expect(closedBy(opened(), 'in_transit', now)).toBeNull();
  });

  it('keeps the stop-desk only for a stop-desk switch and refuses closed items', () => {
    const switched = decide(opened(), {
      decision: 'switch_to_stopdesk',
      stopDeskId: 'sd-16',
      by: 'u1',
      at: now,
    });
    const returned = decide(opened(), {
      decision: 'return',
      stopDeskId: 'sd-16',
      by: 'u1',
      at: now,
    });
    const closed = closedBy(opened(), 'delivered', now);

    expect(switched).toMatchObject({ status: 'decided', stopDeskId: 'sd-16' });
    expect(returned.stopDeskId).toBeNull();
    expect(() => closed && decide(closed, { decision: 'reattempt', by: 'u1', at: now })).toThrow(
      FollowupClosedError,
    );
  });

  it('reopens a decided item on a dispute with a fresh window, never a closed one', () => {
    const decided = decide(opened(), { decision: 'reattempt', by: 'u1', at: now });
    const later = new Date('2026-11-03T08:00:00Z');
    const closed = closedBy(opened(), 'delivered', now);

    const reopened = reopenedByDispute(decided, later);

    expect(reopened).toMatchObject({ status: 'open', decision: 'reattempt', attempts: 1 });
    expect(reopened?.dueAt.getTime()).toBe(later.getTime() + DECISION_WINDOW_MS);
    expect(closed && reopenedByDispute(closed, later)).toBeNull();
  });
});
