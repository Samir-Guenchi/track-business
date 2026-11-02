import type { AuditEntry } from '@trackecom/audit';
import type {
  FollowupMetric,
  FollowupMetricsQuery,
  ListFollowupsQuery,
} from '@trackecom/contracts';
import type { OutboxMessage } from '../../orders/application/ports/orders.ports.js';
import type { FollowupRecord } from '../domain/followup.js';

/** Written in the same transaction as the follow-up row. */
export interface FollowupEffects {
  readonly audit?: AuditEntry;
  readonly events: readonly OutboxMessage[];
  /** The bus event this write applies; a redelivery is refused with EventAlreadyProcessedError. */
  readonly consumed?: { readonly consumer: string; readonly eventId: string };
}

export interface FollowupPage {
  readonly items: readonly FollowupRecord[];
  readonly nextCursor: string | null;
}

export interface FollowupStore {
  findById(storeId: string, id: string): Promise<FollowupRecord | null>;
  findByShipment(storeId: string, shipmentId: string): Promise<FollowupRecord | null>;
  /** Inserts or updates the row (by id) with its effects, atomically. */
  save(record: FollowupRecord, effects: FollowupEffects): Promise<void>;
  list(storeId: string, query: ListFollowupsQuery, now: Date): Promise<FollowupPage>;
  metrics(storeId: string, query: FollowupMetricsQuery): Promise<FollowupMetric[]>;
}

export const FOLLOWUP_STORE = Symbol('FollowupStore');

/** Consumer group reading parcel status changes for follow-ups. */
export const FOLLOWUP_CONSUMER = 'orders.delivery-followup';
