import { Inject, Injectable } from '@nestjs/common';
import { createAuditEntry } from '@trackecom/audit';
import {
  type DecideFollowupRequest,
  FOLLOWUP_EVENTS,
  type FollowupDecidedEvent,
} from '@trackecom/contracts';
import type { OrderActor } from '../../orders/application/order-actor.js';
import { OrderChangeRecorder } from '../../orders/application/order-change.recorder.js';
import type { OutboxMessage } from '../../orders/application/ports/orders.ports.js';
import { type FollowupRecord, decide } from '../domain/followup.js';
import { FollowupNotFoundError } from '../domain/followup.errors.js';
import { FOLLOWUP_STORE, type FollowupStore } from './followup.ports.js';

/** The seller's choice after a failed attempt (#132), audited and sent to shipping. */
@Injectable()
export class DecideFollowupUseCase {
  constructor(
    @Inject(FOLLOWUP_STORE) private readonly followups: FollowupStore,
    private readonly recorder: OrderChangeRecorder,
  ) {}

  async execute(
    actor: OrderActor,
    id: string,
    request: DecideFollowupRequest,
  ): Promise<FollowupRecord> {
    const before = await this.followups.findById(actor.storeId, id);
    if (!before) throw new FollowupNotFoundError();
    const after = decide(before, { ...request, by: actor.userId, at: this.recorder.now() });
    const audit = createAuditEntry(
      {
        storeId: actor.storeId,
        entity: 'order',
        entityId: after.orderId,
        action: 'order.followup_decided',
        actor: { type: 'user', id: actor.userId },
        before: { decision: before.decision, stopDeskId: before.stopDeskId },
        after: { decision: after.decision, stopDeskId: after.stopDeskId, note: after.note },
        ip: actor.ip,
      },
      { newId: this.recorder.newId, now: this.recorder.now },
    );
    await this.followups.save(after, { audit, events: [this.decidedEvent(actor, after)] });
    return after;
  }

  private decidedEvent(actor: OrderActor, followup: FollowupRecord): OutboxMessage {
    const data: FollowupDecidedEvent = {
      followupId: followup.id,
      orderId: followup.orderId,
      shipmentId: followup.shipmentId,
      carrier: followup.carrier,
      trackingNumber: followup.trackingNumber,
      decision: followup.decision ?? 'reattempt',
      stopDeskId: followup.stopDeskId,
    };
    const id = this.recorder.newId();
    const occurredAt = this.recorder.now();
    const envelope = {
      id,
      type: FOLLOWUP_EVENTS.decided,
      occurredAt: occurredAt.toISOString(),
      storeId: actor.storeId,
      correlationId: actor.correlationId,
      data,
    };
    return {
      id,
      type: envelope.type,
      storeId: actor.storeId,
      correlationId: actor.correlationId,
      payload: envelope,
      occurredAt,
    };
  }
}
