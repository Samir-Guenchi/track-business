import type { FailedAttemptReason, ParcelStatus } from '@trackecom/contracts';
import type { NewTrackingEvent, TimelinePlan } from '../../domain/timeline.js';

export interface ShipmentRecord {
  readonly id: string;
  readonly storeId: string;
  readonly orderId: string;
  readonly carrier: string;
  readonly trackingNumber: string;
  readonly status: ParcelStatus;
  readonly publicCode: string;
  readonly lastEventAt: Date | null;
}

export interface TrackingEventRecord {
  readonly id: string;
  readonly status: ParcelStatus | null;
  readonly carrierStatus: string;
  readonly location: string | null;
  readonly note: string | null;
  readonly failureReason: FailedAttemptReason | null;
  readonly at: Date;
}

export interface ShipmentTimeline {
  readonly shipment: ShipmentRecord;
  /** Newest first. */
  readonly events: readonly TrackingEventRecord[];
}

export interface IncomingEvent extends NewTrackingEvent {
  readonly location: string | null;
  readonly note: string | null;
  readonly key: string;
}

export interface OutboxMessage {
  readonly id: string;
  readonly type: string;
  readonly storeId: string;
  readonly correlationId: string;
  readonly payload: unknown;
  readonly occurredAt: Date;
}

export interface IngestDecision {
  readonly plan: TimelinePlan;
  readonly nextPollAt: Date | null;
  readonly outbox: readonly OutboxMessage[];
}

export interface IngestInput {
  /** The store the update came for: a store's webhook can never touch another store's parcel. */
  readonly storeId: string;
  readonly carrier: string;
  readonly trackingNumber: string;
  readonly events: readonly IncomingEvent[];
}

export type Decide = (
  shipment: ShipmentRecord,
  fresh: readonly NewTrackingEvent[],
) => IngestDecision;

export interface TrackingRepository {
  /**
   * In one transaction: stores the events not seen before, asks `decide` what they change, then
   * saves the shipment (optimistic version check) and the outbox messages. null when no shipment
   * has this tracking number. Throws TrackingConflictError when another update won the race.
   */
  ingest(input: IngestInput, decide: Decide): Promise<IngestDecision | null>;
  forOrder(storeId: string, orderId: string): Promise<ShipmentTimeline[]>;
  byPublicCode(publicCode: string): Promise<ShipmentTimeline | null>;
}

export const TRACKING_REPOSITORY = Symbol('TrackingRepository');
