import { Injectable } from '@nestjs/common';
import {
  type AttemptAnswer,
  AttemptAnswerSchema,
  type AttemptChecksReport,
  FailedAttemptReasonSchema,
} from '@trackecom/contracts';
import { Prisma } from '../../../generated/prisma/client.js';
import { writeOutbox } from '../../../infrastructure/outbox/write-outbox.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { OutboxMessage } from '../../../shared/outbox-message.js';
import type {
  AttemptChecksStore,
  CheckedParcel,
  NewAnswer,
} from '../application/attempt-checks.ports.js';

const DISPUTED_LIMIT = 200;
const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

@Injectable()
export class PrismaAttemptChecksStore implements AttemptChecksStore {
  constructor(private readonly prisma: PrismaService) {}

  async parcelByCode(publicCode: string): Promise<CheckedParcel | null> {
    const row = await this.prisma.shipment.findUnique({
      where: { publicCode },
      select: {
        id: true,
        storeId: true,
        orderId: true,
        carrier: true,
        events: {
          where: { status: { not: null } },
          orderBy: { at: 'desc' },
          take: 1,
          select: { id: true, status: true, failureReason: true, at: true },
        },
      },
    });
    if (!row) return null;
    const { events, ...parcel } = row;
    return { ...parcel, latest: events[0] ?? null };
  }

  async answerFor(eventId: string): Promise<AttemptAnswer | null> {
    const row = await this.prisma.attemptAnswer.findUnique({ where: { trackingEventId: eventId } });
    return row ? AttemptAnswerSchema.parse(row.answer) : null;
  }

  async saveAnswer(answer: NewAnswer, outbox: readonly OutboxMessage[]): Promise<boolean> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.attemptAnswer.create({ data: toRow(answer) });
        await writeOutbox(tx, outbox);
      });
      return true;
    } catch (error) {
      if (isUniqueViolation(error)) return false;
      throw error;
    }
  }

  async report(storeId: string, since: Date): Promise<AttemptChecksReport> {
    const where = { storeId, answeredAt: { gte: since } };
    const [answers, disputed] = await Promise.all([
      this.prisma.attemptAnswer.groupBy({ by: ['carrier', 'answer'], where, _count: true }),
      this.prisma.attemptAnswer.findMany({
        where: { ...where, answer: 'not_contacted' },
        orderBy: { answeredAt: 'desc' },
        take: DISPUTED_LIMIT,
      }),
    ]);
    return { carriers: byCarrier(answers), disputed: await this.withParcels(storeId, disputed) };
  }

  private async withParcels(
    storeId: string,
    rows: Prisma.AttemptAnswerGetPayload<object>[],
  ): Promise<AttemptChecksReport['disputed']> {
    const shipments = await this.prisma.shipment.findMany({
      where: { storeId, id: { in: rows.map((row) => row.shipmentId) } },
      select: { id: true, orderId: true, trackingNumber: true, toWilayaCode: true },
    });
    const byId = new Map(shipments.map((shipment) => [shipment.id, shipment]));
    return rows.flatMap((row) => {
      const shipment = byId.get(row.shipmentId);
      if (!shipment) return [];
      return [
        {
          shipmentId: row.shipmentId,
          orderId: shipment.orderId,
          carrier: row.carrier,
          trackingNumber: shipment.trackingNumber,
          toWilayaCode: shipment.toWilayaCode,
          reason: FailedAttemptReasonSchema.parse(row.reason),
          attemptAt: row.attemptAt.toISOString(),
          answeredAt: row.answeredAt.toISOString(),
        },
      ];
    });
  }
}

function toRow(answer: NewAnswer) {
  return {
    trackingEventId: answer.eventId,
    storeId: answer.parcel.storeId,
    shipmentId: answer.parcel.id,
    carrier: answer.parcel.carrier,
    reason: answer.reason,
    attemptAt: answer.attemptAt,
    answer: answer.answer,
    answeredAt: answer.answeredAt,
  };
}

function byCarrier(groups: readonly { carrier: string; answer: string; _count: number }[]) {
  const totals = new Map<string, { carrier: string; answered: number; disputed: number }>();
  for (const group of groups) {
    const total = totals.get(group.carrier) ?? { carrier: group.carrier, answered: 0, disputed: 0 };
    total.answered += group._count;
    if (group.answer === 'not_contacted') total.disputed += group._count;
    totals.set(group.carrier, total);
  }
  return [...totals.values()].sort((a, b) => b.disputed - a.disputed);
}
