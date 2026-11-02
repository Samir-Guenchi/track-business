import type { ExternalOrder } from '@trackecom/connectors';
import type { OutboxMessage } from '../../../../shared/outbox-message.js';
import type { ConnectionRecord } from '../../../connections/application/ports/connection.repository.js';
import type { Place } from '../../domain/address-match.js';
import type { ImportProblem } from '@trackecom/contracts';

export const SYNC_PORTS = {
  geo: Symbol('GeoReference'),
  ledger: Symbol('ImportLedger'),
  claims: Symbol('SyncClaims'),
  pending: Symbol('PendingOrders'),
} as const;

/** Wilayas and communes from shipping's reference data. Throws when it cannot be reached. */
export interface GeoReference {
  wilayas(): Promise<readonly Place[]>;
  communes(wilayaCode: number): Promise<readonly Place[]>;
}

/** `sent` became an event, `needs_fix` waits for the seller, `skipped` never will be an order. */
export type ImportState = 'sent' | 'needs_fix' | 'skipped';

export interface KnownOrder {
  readonly shopUpdatedAt: Date;
  readonly state: ImportState;
}

export interface LedgerEntry {
  readonly connection: ConnectionRecord;
  readonly order: ExternalOrder;
  readonly state: ImportState;
  readonly problem: ImportProblem | null;
}

/** What integrations remembers of each shop order, so a replay or an overlap changes nothing. */
export interface ImportLedger {
  known(connectionId: string, externalIds: readonly string[]): Promise<Map<string, KnownOrder>>;
  /** Saves the entry and its event in one transaction; counts a first `sent` on the shop. */
  record(entry: LedgerEntry, messages: readonly OutboxMessage[]): Promise<void>;
}

/** A shop order held back for the seller, with the shop data it arrived with. */
export interface PendingOrder {
  readonly connection: ConnectionRecord;
  readonly order: ExternalOrder;
  readonly problem: ImportProblem;
  readonly receivedAt: Date;
}

export interface PendingKey {
  readonly connectionId: string;
  readonly externalId: string;
}

/** The seller's review queue, always read through the store that owns the shop. */
export interface PendingOrders {
  list(storeId: string): Promise<PendingOrder[]>;
  find(storeId: string, key: PendingKey): Promise<PendingOrder | null>;
}

export interface SyncOutcome {
  readonly syncedThrough: Date;
  /** More pages wait: the shop is due again at once instead of after the interval. */
  readonly more: boolean;
}

/** Leases shops for polling so replicas never sync the same one at the same time. */
export interface SyncClaims {
  claimDue(now: Date, staleBefore: Date): Promise<ConnectionRecord | null>;
  /** `syncedAt` is backdated by the caller when more pages wait, so the shop is due at once. */
  succeeded(
    connection: ConnectionRecord,
    result: { syncedThrough: Date; syncedAt: Date },
  ): Promise<void>;
  failed(
    connection: ConnectionRecord,
    failure: { reconnect: boolean; error: string },
  ): Promise<void>;
}
