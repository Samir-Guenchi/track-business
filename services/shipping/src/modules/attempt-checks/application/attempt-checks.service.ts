import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  ATTEMPT_CHECK_EVENTS,
  type AnswerAttemptCheck,
  type AttemptChecksReport,
  type AttemptDisputedEvent,
  type PublicAttemptCheck,
} from '@trackecom/contracts';
import { outboxMessage } from '../../../shared/outbox-message.js';
import { TrackingNotFoundError } from '../../tracking/domain/tracking.errors.js';
import {
  AttemptAlreadyAnsweredError,
  AttemptNotCheckableError,
  type CheckableAttempt,
  checkableAttempt,
} from '../domain/attempt-check.js';
import {
  ATTEMPT_CHECKS_CLOCK,
  ATTEMPT_CHECKS_STORE,
  type AttemptChecksStore,
  type CheckedParcel,
  type Clock,
} from './attempt-checks.ports.js';

const DAY_MS = 86_400_000;

/**
 * "Did the courier call or come?" on the tracking page (#195). The public code is the only key,
 * as for tracking. A "no" is published so orders can raise the order for a new attempt.
 */
@Injectable()
export class AttemptChecksService {
  constructor(
    @Inject(ATTEMPT_CHECKS_STORE) private readonly store: AttemptChecksStore,
    @Inject(ATTEMPT_CHECKS_CLOCK) private readonly now: Clock,
  ) {}

  async check(publicCode: string): Promise<PublicAttemptCheck> {
    const attempt = checkableAttempt((await this.parcel(publicCode)).latest, this.now());
    if (!attempt) return { check: null };
    const answer = await this.store.answerFor(attempt.eventId);
    return { check: { ...attempt, at: attempt.at.toISOString(), answer } };
  }

  async answer(publicCode: string, body: AnswerAttemptCheck): Promise<PublicAttemptCheck> {
    const parcel = await this.parcel(publicCode);
    const now = this.now();
    const attempt = checkableAttempt(parcel.latest, now);
    if (attempt?.eventId !== body.eventId) {
      throw new AttemptNotCheckableError('This delivery attempt can no longer be answered');
    }
    const saved = await this.store.saveAnswer(
      {
        parcel,
        eventId: attempt.eventId,
        reason: attempt.reason,
        attemptAt: attempt.at,
        answer: body.answer,
        answeredAt: now,
      },
      body.answer === 'not_contacted' ? [disputeMessage(parcel, attempt, now)] : [],
    );
    if (!saved) throw new AttemptAlreadyAnsweredError('This attempt was already answered');
    return this.check(publicCode);
  }

  report(storeId: string, days: number): Promise<AttemptChecksReport> {
    return this.store.report(storeId, new Date(this.now().getTime() - days * DAY_MS));
  }

  private async parcel(publicCode: string): Promise<CheckedParcel> {
    const parcel = await this.store.parcelByCode(publicCode);
    if (!parcel) throw new TrackingNotFoundError('No parcel for this tracking link');
    return parcel;
  }
}

function disputeMessage(parcel: CheckedParcel, attempt: CheckableAttempt, now: Date) {
  const data: AttemptDisputedEvent = {
    shipmentId: parcel.id,
    orderId: parcel.orderId,
    carrier: parcel.carrier,
    reason: attempt.reason,
    attemptAt: attempt.at.toISOString(),
  };
  const origin = { storeId: parcel.storeId, correlationId: randomUUID(), now };
  return outboxMessage(origin, ATTEMPT_CHECK_EVENTS.disputed, data);
}
