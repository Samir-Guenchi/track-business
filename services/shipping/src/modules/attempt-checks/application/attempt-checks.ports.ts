import type { AttemptAnswer, AttemptChecksReport, FailedAttemptReason } from '@trackecom/contracts';
import type { OutboxMessage } from '../../../shared/outbox-message.js';
import type { LatestEvent } from '../domain/attempt-check.js';

export const ATTEMPT_CHECKS_STORE = Symbol('ATTEMPT_CHECKS_STORE');
export const ATTEMPT_CHECKS_CLOCK = Symbol('ATTEMPT_CHECKS_CLOCK');
export type Clock = () => Date;

export interface CheckedParcel {
  readonly id: string;
  readonly storeId: string;
  readonly orderId: string;
  readonly carrier: string;
  readonly latest: LatestEvent | null;
}

export interface NewAnswer {
  readonly parcel: CheckedParcel;
  readonly eventId: string;
  readonly reason: FailedAttemptReason;
  readonly attemptAt: Date;
  readonly answer: AttemptAnswer;
  readonly answeredAt: Date;
}

export interface AttemptChecksStore {
  parcelByCode(publicCode: string): Promise<CheckedParcel | null>;
  answerFor(eventId: string): Promise<AttemptAnswer | null>;
  /** false when this attempt was already answered (first answer wins). */
  saveAnswer(answer: NewAnswer, outbox: readonly OutboxMessage[]): Promise<boolean>;
  report(storeId: string, since: Date): Promise<AttemptChecksReport>;
}
