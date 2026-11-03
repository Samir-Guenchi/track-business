import { Injectable } from '@nestjs/common';
import {
  type ListLiveSessionsResponse,
  LiveProductSchema,
  type LiveSession,
} from '@trackecom/contracts';
import { z } from 'zod';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type {
  LiveSessionsStore,
  NewLiveSession,
  NewReservation,
} from '../application/live-selling.ports.js';

const ProductsSchema = z.array(LiveProductSchema);
const LIST_LIMIT = 50;

type ReservationRow = Prisma.LiveReservationGetPayload<object>;

const toReservation = (row: ReservationRow) => ({
  id: row.id,
  phone: row.phone,
  name: row.name,
  code: row.code,
  size: row.size,
  quantity: row.quantity,
  comment: row.comment,
  createdAt: row.createdAt.toISOString(),
  orderId: row.orderId,
});

@Injectable()
export class PrismaLiveSessionsStore implements LiveSessionsStore {
  constructor(private readonly prisma: PrismaService) {}

  async create(session: NewLiveSession): Promise<void> {
    await this.prisma.liveSession.create({
      data: { ...session, products: [...session.products] },
    });
  }

  async list(storeId: string): Promise<ListLiveSessionsResponse['items']> {
    const rows = await this.prisma.liveSession.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: LIST_LIMIT,
      select: {
        id: true,
        title: true,
        createdAt: true,
        reservations: { select: { orderId: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      createdAt: row.createdAt.toISOString(),
      reservations: row.reservations.length,
      ordered: row.reservations.filter((reservation) => reservation.orderId !== null).length,
    }));
  }

  async get(storeId: string, id: string): Promise<LiveSession | null> {
    const row = await this.prisma.liveSession.findFirst({
      where: { id, storeId },
      include: { reservations: { orderBy: { createdAt: 'asc' } } },
    });
    if (!row) return null;
    return {
      id: row.id,
      title: row.title,
      createdAt: row.createdAt.toISOString(),
      products: ProductsSchema.parse(row.products),
      reservations: row.reservations.map(toReservation),
    };
  }

  async addReservations(
    session: { storeId: string; id: string },
    reservations: readonly NewReservation[],
  ): Promise<number> {
    const { count } = await this.prisma.liveReservation.createMany({
      data: reservations.map((reservation) => ({
        ...reservation,
        storeId: session.storeId,
        sessionId: session.id,
      })),
      skipDuplicates: true,
    });
    return count;
  }

  async linkOrder(
    session: { storeId: string; id: string },
    link: { reservationId: string; orderId: string },
  ): Promise<boolean> {
    const { count } = await this.prisma.liveReservation.updateMany({
      where: { id: link.reservationId, sessionId: session.id, storeId: session.storeId },
      data: { orderId: link.orderId },
    });
    return count === 1;
  }
}
