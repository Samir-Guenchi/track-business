import type { Prisma } from '../../generated/prisma/client.js';
import type { OutboxMessage } from '../../shared/outbox-message.js';

/** Writes outbox rows in the caller's transaction, next to the change they describe. */
export async function writeOutbox(
  tx: Prisma.TransactionClient,
  messages: readonly OutboxMessage[],
): Promise<void> {
  if (messages.length === 0) return;
  await tx.outboxEvent.createMany({
    data: messages.map((message) => ({
      ...message,
      payload: message.payload as Prisma.InputJsonValue,
    })),
  });
}
