import { toAuditRow } from '@trackecom/audit';
import { Prisma } from '../../../generated/prisma/client.js';
import type { OrderEffects } from '../application/ports/orders.ports.js';
import type { OrderRecord } from '../domain/order.js';
import { EventAlreadyProcessedError, OrderConflictError } from '../domain/order.errors.js';

export type Tx = Prisma.TransactionClient;

/** Optimistic lock: the row must still be at the version we read. */
export async function writeOrderVersion(
  tx: Tx,
  order: OrderRecord,
  data: Prisma.OrderUncheckedUpdateManyInput,
): Promise<void> {
  const { count } = await tx.order.updateMany({
    where: { id: order.id, storeId: order.storeId, version: order.version - 1, deletedAt: null },
    data,
  });
  if (count !== 1) throw new OrderConflictError();
}

/** The audit row and outbox events of a change, in the caller's transaction. */
export async function writeOrderEffects(tx: Tx, effects: OrderEffects): Promise<void> {
  const audit = toAuditRow(effects.audit);
  await tx.auditEvent.create({
    data: { ...audit, changes: audit.changes as Prisma.InputJsonValue },
  });
  await writeOutbox(tx, effects.events);
  if (effects.consumed) await markConsumed(tx, effects.consumed);
}

async function markConsumed(tx: Tx, consumed: NonNullable<OrderEffects['consumed']>) {
  await tx.processedEvent.create({ data: consumed }).catch((error: unknown) => {
    const duplicate =
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
    throw duplicate ? new EventAlreadyProcessedError(consumed.eventId) : error;
  });
}

export async function writeOutbox(tx: Tx, events: OrderEffects['events']): Promise<void> {
  if (events.length === 0) return;
  await tx.outboxEvent.createMany({
    data: events.map((event) => ({ ...event, payload: event.payload as Prisma.InputJsonValue })),
  });
}
