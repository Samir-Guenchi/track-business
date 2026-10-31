import type { FailedAttemptReason, ParcelStatus } from '@trackecom/contracts';

export interface ShipmentState {
  readonly status: ParcelStatus;
  readonly lastEventAt: Date | null;
}

/** A carrier event that was not on the timeline yet (duplicates are filtered before this). */
export interface NewTrackingEvent {
  readonly status: ParcelStatus | null;
  readonly carrierStatus: string;
  readonly at: Date;
  readonly failureReason: FailedAttemptReason | null;
}

export interface StatusTransition {
  readonly from: ParcelStatus;
  readonly to: ParcelStatus;
  readonly failureReason: FailedAttemptReason | null;
  readonly at: Date;
}

export interface TimelinePlan {
  readonly status: ParcelStatus;
  readonly lastEventAt: Date | null;
  /** One per real change, oldest first: each becomes a status-changed event. */
  readonly transitions: readonly StatusTransition[];
  /** Carrier labels we could not map, once each: alerted so someone adds them to the map. */
  readonly unknownStatuses: readonly string[];
}

/**
 * Folds new events into the shipment's state. Events older than the last one we applied are kept
 * on the timeline but do not move the status back (carriers deliver webhooks out of order).
 */
export function planTimeline(
  state: ShipmentState,
  events: readonly NewTrackingEvent[],
): TimelinePlan {
  const sorted = [...events].sort((a, b) => a.at.getTime() - b.at.getTime());
  const transitions: StatusTransition[] = [];
  let { status, lastEventAt } = state;
  for (const event of sorted) {
    if (!event.status || (lastEventAt && event.at < lastEventAt)) continue;
    if (event.status !== status) {
      transitions.push({
        from: status,
        to: event.status,
        failureReason: event.failureReason,
        at: event.at,
      });
    }
    status = event.status;
    lastEventAt = event.at;
  }
  const unknownStatuses = [...new Set(sorted.filter((e) => !e.status).map((e) => e.carrierStatus))];
  return { status, lastEventAt, transitions, unknownStatuses };
}
