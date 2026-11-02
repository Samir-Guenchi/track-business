import type {
  ExpectedReturn,
  ListExpectedReturnsQuery,
  ListReturnBatchesQuery,
  ReturnBatch,
  ReturnBatchSummary,
} from '@trackecom/contracts';
import type { OutboxMessage } from '../../../shared/outbox-message.js';
import type { KnownParcel, Receipt } from '../domain/return-batch.js';

export const RETURNS_STORE = Symbol('RETURNS_STORE');
export const RETURNS_CLOCK = Symbol('RETURNS_CLOCK');
export type Clock = () => Date;

export interface ExpectedQuery {
  readonly storeId: string;
  readonly query: ListExpectedReturnsQuery;
  readonly now: Date;
}

export interface Page<T> {
  readonly items: T[];
  readonly nextCursor: string | null;
}

export interface CarrierReturnCount {
  readonly carrier: string;
  readonly expected: number;
  readonly overdue: number;
}

export interface NewBatch {
  readonly id: string;
  readonly storeId: string;
  readonly carrier: string;
  readonly courierName: string | null;
  readonly note: string | null;
  readonly receivedBy: string;
  readonly createdAt: Date;
  readonly receipts: readonly Receipt[];
  readonly missing: readonly string[];
  readonly unknown: readonly string[];
  readonly alreadyReceived: readonly string[];
}

/** Persistence of the return chain; every method is scoped by store. */
export interface ReturnsStore {
  expected(input: ExpectedQuery): Promise<Page<ExpectedReturn>>;
  countByCarrier(storeId: string, cutoff: Date): Promise<CarrierReturnCount[]>;
  findParcels(
    storeId: string,
    carrier: string,
    trackingNumbers: readonly string[],
  ): Promise<Map<string, KnownParcel>>;
  /** Stores the batch, its receipts and their events in one transaction. */
  saveBatch(batch: NewBatch, outbox: readonly OutboxMessage[]): Promise<void>;
  batch(storeId: string, id: string): Promise<ReturnBatch | null>;
  batches(storeId: string, query: ListReturnBatchesQuery): Promise<Page<ReturnBatchSummary>>;
}
