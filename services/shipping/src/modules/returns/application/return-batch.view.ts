import type { ReturnBatch } from '@trackecom/contracts';
import type { NewBatch } from './returns.ports.js';

/** The API shape of a batch, from what was stored. */
export function toReturnBatch(batch: NewBatch): ReturnBatch {
  return {
    id: batch.id,
    carrier: batch.carrier,
    courierName: batch.courierName,
    note: batch.note,
    receivedBy: batch.receivedBy,
    createdAt: batch.createdAt.toISOString(),
    received: batch.receipts.map((receipt) => ({ ...receipt })),
    missing: [...batch.missing],
    unknown: [...batch.unknown],
    alreadyReceived: [...batch.alreadyReceived],
  };
}
