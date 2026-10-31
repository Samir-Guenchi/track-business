import type { CallOutcome, ConfirmationSettings } from '@trackecom/contracts';
import type { OrderEffects } from '../../../orders/application/ports/orders.ports.js';
import type { OrderRecord } from '../../../orders/domain/order.js';

export const CONFIRMATION_REPOSITORY = Symbol('ConfirmationRepository');

export interface CallAttemptRecord {
  readonly id: string;
  readonly storeId: string;
  readonly orderId: string;
  readonly agentId: string;
  readonly outcome: CallOutcome;
  readonly reason: string | null;
  readonly note: string | null;
  readonly callBackAt: Date | null;
  readonly durationSec: number;
  readonly at: Date;
}

/** Queue fields kept on the order row. */
export interface QueueState {
  readonly lockedBy: string | null;
  readonly lockedUntil: Date | null;
  readonly nextCallAt: Date | null;
  readonly unreachedCalls: number;
  readonly callsToday: number;
  readonly lastCallDay: string | null;
}

export interface ClaimRequest {
  readonly storeId: string;
  readonly agentId: string;
  readonly now: Date;
  readonly lockUntil: Date;
  readonly day: string;
  readonly maxPerDay: number;
  /** Empty lists mean "any". */
  readonly wilayaCodes: readonly number[];
  readonly productIds: readonly string[];
}

export interface RecordedCall {
  readonly order: OrderRecord;
  readonly queue: QueueState;
  readonly attempt: CallAttemptRecord;
  readonly effects: OrderEffects;
}

export interface ConfirmationRepository {
  settings(storeId: string): Promise<ConfirmationSettings>;
  saveSettings(storeId: string, settings: ConfirmationSettings): Promise<void>;
  /** Atomically picks and locks the next order; two agents can never get the same one. */
  claimNext(request: ClaimRequest): Promise<string | null>;
  queueState(storeId: string, orderId: string): Promise<QueueState | null>;
  release(storeId: string, orderId: string, agentId: string): Promise<boolean>;
  attempts(storeId: string, orderId: string, limit: number): Promise<CallAttemptRecord[]>;
  /** Order change, attempt, queue fields, audit and events in one transaction (version-checked). */
  recordCall(call: RecordedCall): Promise<void>;
}
