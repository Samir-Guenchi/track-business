import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  type CreateReturnBatchRequest,
  RETURN_EVENTS,
  type ReturnBatch,
  type ReturnReceivedEvent,
} from '@trackecom/contracts';
import type { StoreContext } from '@trackecom/service-kit';
import { type OutboxMessage, outboxMessage } from '../../../shared/outbox-message.js';
import { sortBatch } from '../domain/return-batch.js';
import {
  type Clock,
  type NewBatch,
  RETURNS_CLOCK,
  RETURNS_STORE,
  type ReturnsStore,
} from './returns.ports.js';
import { toReturnBatch } from './return-batch.view.js';

/**
 * The seller scans what a courier hands back (#133). Each known parcel is received once, with an
 * event for stock and the order; unknown, repeated and missing numbers stay on the batch as proof.
 */
@Injectable()
export class ReceiveReturnBatchUseCase {
  constructor(
    @Inject(RETURNS_STORE) private readonly store: ReturnsStore,
    @Inject(RETURNS_CLOCK) private readonly clock: Clock,
  ) {}

  async execute(store: StoreContext, body: CreateReturnBatchRequest): Promise<ReturnBatch> {
    const numbers = body.scanned.map((scan) => scan.trackingNumber);
    const known = await this.store.findParcels(store.storeId, body.carrier, numbers);
    const sort = sortBatch(body.scanned, known, body.declared);
    const batch: NewBatch = {
      id: randomUUID(),
      storeId: store.storeId,
      carrier: body.carrier,
      courierName: body.courierName ?? null,
      note: body.note ?? null,
      receivedBy: store.userId,
      createdAt: this.clock(),
      receipts: sort.received,
      missing: sort.missing,
      unknown: sort.unknown,
      alreadyReceived: sort.alreadyReceived,
    };
    await this.store.saveBatch(batch, receivedEvents(batch));
    return toReturnBatch(batch);
  }
}

function receivedEvents(batch: NewBatch): OutboxMessage[] {
  const origin = { storeId: batch.storeId, correlationId: randomUUID(), now: batch.createdAt };
  return batch.receipts.map((receipt) => {
    const data: ReturnReceivedEvent = {
      shipmentId: receipt.shipmentId,
      orderId: receipt.orderId,
      batchId: batch.id,
      carrier: batch.carrier,
      trackingNumber: receipt.trackingNumber,
      condition: receipt.condition,
      receivedAt: batch.createdAt.toISOString(),
    };
    return outboxMessage(origin, RETURN_EVENTS.received, data);
  });
}
