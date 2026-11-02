import type { StorePricesResponse, Utm } from '@trackecom/contracts';
import type { OrderFormRecord } from '../domain/order-form.js';
import type { SubmissionHistory, SubmissionOutcome } from '../domain/submission-screen.js';

export const ORDER_FORM_STORE = Symbol('ORDER_FORM_STORE');
export const STORE_PRICES = Symbol('STORE_PRICES');

/** Persistence of order forms; seller reads are scoped by store, public reads by key. */
export interface OrderFormStore {
  list(storeId: string): Promise<OrderFormRecord[]>;
  byId(storeId: string, id: string): Promise<OrderFormRecord | null>;
  byKey(key: string): Promise<OrderFormRecord | null>;
  insert(form: OrderFormRecord): Promise<void>;
  /** Replaces the editable fields; false when the form is not in this store. */
  update(form: OrderFormRecord): Promise<boolean>;
}

/** The store's delivery prices, owned by shipping. null when shipping cannot be reached. */
export interface StorePriceSource {
  pricesFor(storeId: string): Promise<StorePricesResponse | null>;
}

export const SUBMISSION_LOG = Symbol('SUBMISSION_LOG');

export interface SubmissionRecord {
  readonly id: string;
  readonly formId: string;
  readonly storeId: string;
  readonly orderId: string | null;
  readonly outcome: SubmissionOutcome;
  readonly phone: string;
  readonly productId: string;
  readonly ipHash: string;
  readonly utm: Utm;
  readonly createdAt: Date;
}

export interface HistoryQuery {
  readonly storeId: string;
  readonly ipHash: string;
  readonly phone: string;
  readonly productId: string;
  readonly now: Date;
}

/** Every attempt on a public form, kept for limits, duplicates and campaign analytics. */
export interface SubmissionLog {
  history(query: HistoryQuery): Promise<SubmissionHistory>;
  record(submission: SubmissionRecord): Promise<void>;
}
