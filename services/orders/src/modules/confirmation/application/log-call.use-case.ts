import { Inject, Injectable } from '@nestjs/common';
import { CONFIRMATION_EVENTS, type LogCallRequest, ORDER_EVENTS } from '@trackecom/contracts';
import { loadOrder, nextVersion } from '../../orders/application/load-order.js';
import type { OrderActor } from '../../orders/application/order-actor.js';
import { OrderChangeRecorder } from '../../orders/application/order-change.recorder.js';
import { ORDERS_PORTS, type OrderRepository } from '../../orders/application/ports/orders.ports.js';
import type { OrderRecord } from '../../orders/domain/order.js';
import { algiersDay, type CallPlan, planCall } from '../domain/call-plan.js';
import { NotLockedError, OutcomeNotAllowedError } from '../domain/confirmation.errors.js';
import {
  type CallAttemptRecord,
  CONFIRMATION_REPOSITORY,
  type ConfirmationRepository,
  type QueueState,
} from './ports/confirmation.repository.js';

/** Logs a call on an order the agent holds, applies its outcome and releases the lock. */
@Injectable()
export class LogCallUseCase {
  constructor(
    @Inject(CONFIRMATION_REPOSITORY) private readonly repository: ConfirmationRepository,
    @Inject(ORDERS_PORTS.repository) private readonly orders: OrderRepository,
    private readonly recorder: OrderChangeRecorder,
  ) {}

  async execute(actor: OrderActor, request: LogCallRequest) {
    const now = this.recorder.now();
    const before = await loadOrder(this.orders, actor.storeId, request.orderId);
    const state = await this.heldState(actor, before.id, now);
    const { unreachableAfter } = await this.repository.settings(actor.storeId);
    const callBackAt =
      'callBackAt' in request && request.callBackAt ? new Date(request.callBackAt) : null;
    const plan = planCall({
      ...state,
      status: before.status,
      outcome: request.outcome,
      unreachableAfter,
      callBackAt,
    });
    if (!plan) throw new OutcomeNotAllowedError(before.status, request.outcome);
    const attempt = this.attempt(actor, request, { callBackAt, at: now });
    const after = this.applyPlan(before, plan, now);
    await this.repository.recordCall({
      order: after,
      queue: this.nextQueueState(state, plan, now),
      attempt,
      effects: this.effects(actor, { before, after, attempt }),
    });
    return { attempt, orderStatus: after.status };
  }

  private async heldState(actor: OrderActor, orderId: string, now: Date): Promise<QueueState> {
    const state = await this.repository.queueState(actor.storeId, orderId);
    const held = state?.lockedBy === actor.userId && state.lockedUntil && state.lockedUntil > now;
    if (!state || !held) throw new NotLockedError();
    return state;
  }

  private applyPlan(before: OrderRecord, plan: CallPlan, now: Date): OrderRecord {
    if (plan.status === before.status) return nextVersion(before, {}, now);
    const postponedUntil = plan.status === 'postponed' ? plan.nextCallAt : null;
    return nextVersion(before, { status: plan.status, postponedUntil, statusChangedAt: now }, now);
  }

  private nextQueueState(state: QueueState, plan: CallPlan, now: Date): QueueState {
    const day = algiersDay(now);
    const callsToday = state.lastCallDay === day ? state.callsToday + 1 : 1;
    return {
      lockedBy: null,
      lockedUntil: null,
      nextCallAt: plan.nextCallAt,
      unreachedCalls: plan.unreachedCalls,
      callsToday,
      lastCallDay: day,
    };
  }

  private attempt(
    actor: OrderActor,
    request: LogCallRequest,
    timing: { callBackAt: Date | null; at: Date },
  ): CallAttemptRecord {
    return {
      id: this.recorder.newId(),
      storeId: actor.storeId,
      orderId: request.orderId,
      agentId: actor.userId,
      outcome: request.outcome,
      reason: 'reason' in request ? request.reason : null,
      note: request.note ?? null,
      durationSec: request.durationSec,
      ...timing,
    };
  }

  private effects(
    actor: OrderActor,
    change: { before: OrderRecord; after: OrderRecord; attempt: CallAttemptRecord },
  ) {
    const { before, after, attempt } = change;
    const logged = {
      type: CONFIRMATION_EVENTS.callLogged,
      data: {
        attemptId: attempt.id,
        orderId: after.id,
        agentId: attempt.agentId,
        outcome: attempt.outcome,
        durationSec: attempt.durationSec,
        at: attempt.at.toISOString(),
      },
    };
    const moved = before.status !== after.status;
    const statusChanged = {
      type: ORDER_EVENTS.statusChanged,
      data: {
        orderId: after.id,
        from: before.status,
        to: after.status,
        actorId: actor.userId,
        reason: attempt.reason,
      },
    };
    return this.recorder.effects(actor, {
      action: 'call_logged',
      before,
      after,
      extra: { outcome: attempt.outcome, reason: attempt.reason, note: attempt.note },
      events: moved ? [logged, statusChanged] : [logged],
    });
  }
}
