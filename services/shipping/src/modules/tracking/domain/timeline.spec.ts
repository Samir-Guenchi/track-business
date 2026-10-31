import { describe, expect, it } from 'vitest';
import { type NewTrackingEvent, planTimeline } from './timeline.js';

const at = (hour: number) => new Date(Date.UTC(2026, 10, 1, hour));
const event = (
  status: NewTrackingEvent['status'],
  hour: number,
  carrierStatus = String(status),
) => ({
  status,
  carrierStatus,
  at: at(hour),
  failureReason: null,
});

describe('planTimeline', () => {
  it('emits one transition per real change, oldest first', () => {
    const plan = planTimeline({ status: 'created', lastEventAt: null }, [
      event('in_transit', 10),
      event('picked_up', 8),
      event('in_transit', 12, 'Transfert'),
    ]);

    expect(plan.transitions.map((t) => `${t.from}>${t.to}`)).toEqual([
      'created>picked_up',
      'picked_up>in_transit',
    ]);
    expect(plan.status).toBe('in_transit');
    expect(plan.lastEventAt).toEqual(at(12));
  });

  it('keeps a late event on the timeline without moving the status back', () => {
    const plan = planTimeline({ status: 'out_for_delivery', lastEventAt: at(14) }, [
      event('in_transit', 9),
    ]);

    expect(plan.transitions).toEqual([]);
    expect(plan.status).toBe('out_for_delivery');
    expect(plan.lastEventAt).toEqual(at(14));
  });

  it('carries the failure reason of a failed attempt', () => {
    const failed = { ...event('failed_attempt', 15), failureReason: 'phone_off' as const };
    const plan = planTimeline({ status: 'out_for_delivery', lastEventAt: at(9) }, [failed]);

    expect(plan.transitions[0]).toMatchObject({ to: 'failed_attempt', failureReason: 'phone_off' });
  });

  it('reports each unmapped carrier label once and leaves the status alone', () => {
    const plan = planTimeline({ status: 'in_transit', lastEventAt: at(8) }, [
      event(null, 9, 'Colis bloqué'),
      event(null, 10, 'Colis bloqué'),
    ]);

    expect(plan.unknownStatuses).toEqual(['Colis bloqué']);
    expect(plan.status).toBe('in_transit');
    expect(plan.transitions).toEqual([]);
  });

  it('changes nothing when there is nothing new', () => {
    const state = { status: 'delivered' as const, lastEventAt: at(16) };

    expect(planTimeline(state, [])).toEqual({ ...state, transitions: [], unknownStatuses: [] });
  });
});
