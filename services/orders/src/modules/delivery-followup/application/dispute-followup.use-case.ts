import { Inject, Injectable } from '@nestjs/common';
import { createAuditEntry } from '@trackecom/audit';
import {
  type AttemptDisputedEvent,
  AttemptDisputedEventSchema,
  type EventEnvelope,
} from '@trackecom/contracts';
import { OrderChangeRecorder } from '../../orders/application/order-change.recorder.js';
import { EventAlreadyProcessedError } from '../../orders/domain/order.errors.js';
import { type FollowupRecord, reopenedByDispute } from '../domain/followup.js';
import { FOLLOWUP_CONSUMER, FOLLOWUP_STORE, type FollowupStore } from './followup.ports.js';

export type DisputeResult = 'reopened' | 'ignored' | 'duplicate';

/**
 * The customer told the tracking page that nobody came or called (#195). The follow-up goes back
 * to the top of the seller's queue and the order history keeps the customer's word.
 */
@Injectable()
export class DisputeFollowupUseCase {
  constructor(
    @Inject(FOLLOWUP_STORE) private readonly followups: FollowupStore,
    private readonly recorder: OrderChangeRecorder,
  ) {}

  async execute(event: EventEnvelope): Promise<DisputeResult> {
    const data = AttemptDisputedEventSchema.parse(event.data);
    const current = await this.followups.findByShipment(event.storeId, data.shipmentId);
    const next = current && reopenedByDispute(current, this.recorder.now());
    if (!current || !next) return 'ignored';
    try {
      await this.followups.save(next, {
        audit: this.audit(event.storeId, current, data),
        events: [],
        consumed: { consumer: FOLLOWUP_CONSUMER, eventId: event.id },
      });
    } catch (error) {
      if (error instanceof EventAlreadyProcessedError) return 'duplicate';
      throw error;
    }
    return 'reopened';
  }

  private audit(storeId: string, before: FollowupRecord, data: AttemptDisputedEvent) {
    return createAuditEntry(
      {
        storeId,
        entity: 'order',
        entityId: before.orderId,
        action: 'order.attempt_disputed',
        actor: { type: 'system', id: 'shipping.attempt-check' },
        before: { followupStatus: before.status },
        after: {
          followupStatus: 'open',
          carrier: data.carrier,
          reason: data.reason,
          attemptAt: data.attemptAt,
        },
      },
      { newId: this.recorder.newId, now: this.recorder.now },
    );
  }
}
