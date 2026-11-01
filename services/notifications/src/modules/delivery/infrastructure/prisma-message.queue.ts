import { Injectable } from '@nestjs/common';
import {
  ChannelSchema,
  MessageLanguageSchema,
  NotificationTriggerSchema,
} from '@trackecom/contracts';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type {
  DueMessage,
  MessageQueue,
  NewMessage,
  Receipt,
  SendOutcome,
} from '../application/ports/delivery.ports.js';

interface DueRow extends Omit<DueMessage, 'trigger' | 'channel' | 'language'> {
  trigger: string;
  channel: string;
  language: string;
}

const RELEASED = { lockedUntil: null };

function outcomeData(outcome: SendOutcome): Prisma.MessageUpdateInput {
  switch (outcome.kind) {
    case 'sent': {
      const { provider, providerId, costCentimes, at } = outcome;
      return {
        ...RELEASED,
        status: 'sent',
        provider,
        providerId,
        costCentimes,
        sentAt: at,
        lastError: null,
      };
    }
    case 'skipped':
      return { ...RELEASED, status: 'skipped', skipReason: outcome.reason };
    case 'retry':
      return { ...RELEASED, sendAfter: outcome.sendAfter, lastError: outcome.error };
    case 'failed':
      return { ...RELEASED, status: 'failed', lastError: outcome.error };
  }
}

@Injectable()
export class PrismaMessageQueue implements MessageQueue {
  constructor(private readonly prisma: PrismaService) {}

  async enqueue(message: NewMessage): Promise<boolean> {
    try {
      await this.prisma.message.create({ data: { ...message, status: 'queued' } });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        return false;
      throw error;
    }
  }

  /** Leases due messages with SKIP LOCKED, so replicas never claim the same row. */
  async claimDue(lease: { now: Date; until: Date; limit: number }): Promise<DueMessage[]> {
    const rows = await this.prisma.$queryRaw<DueRow[]>`
      UPDATE messages SET locked_until = ${lease.until}, attempts = attempts + 1
      WHERE id IN (
        SELECT id FROM messages
        WHERE status = 'queued' AND send_after <= ${lease.now}
          AND (locked_until IS NULL OR locked_until <= ${lease.now})
        ORDER BY send_after LIMIT ${lease.limit}
        FOR UPDATE SKIP LOCKED)
      RETURNING id, store_id AS "storeId", order_id AS "orderId", trigger, channel, language,
        source_event_id AS "sourceEventId", shipment_id AS "shipmentId", send_after AS "sendAfter",
        queued_at AS "queuedAt", attempts`;
    return rows.map((row) => ({
      ...row,
      trigger: NotificationTriggerSchema.parse(row.trigger),
      channel: ChannelSchema.parse(row.channel),
      language: MessageLanguageSchema.parse(row.language),
    }));
  }

  async complete(id: string, outcome: SendOutcome): Promise<void> {
    await this.prisma.message.update({ where: { id }, data: outcomeData(outcome) });
  }

  async applyReceipt(provider: string, receipt: Receipt): Promise<boolean> {
    const delivered = receipt.status === 'delivered';
    const { count } = await this.prisma.message.updateMany({
      where: { provider, providerId: receipt.providerId, status: { in: ['sent', 'delivered'] } },
      data: { status: receipt.status, ...(delivered ? { deliveredAt: receipt.at } : {}) },
    });
    return count > 0;
  }
}
