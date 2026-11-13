import { Injectable } from '@nestjs/common';
import type { DeliveryRequest, ListDeliveryRequestsQuery } from '@trackecom/contracts';
import { writeOutbox } from '../../../infrastructure/outbox/write-outbox.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { OutboxMessage } from '../../../shared/outbox-message.js';
import type {
  DeliveryRequestsStore,
  NewDeliveryRequest,
  StateChange,
  TrackedParcel,
} from '../application/delivery-requests.ports.js';
import {
  PARCEL_FIELDS,
  toParcel,
  toPublic,
  toSeller,
  WITH_SHIPMENT,
} from './delivery-request-rows.js';

const HISTORY_LIMIT = 20;

@Injectable()
export class PrismaDeliveryRequestsStore implements DeliveryRequestsStore {
  constructor(private readonly prisma: PrismaService) {}

  async parcelByCode(publicCode: string): Promise<TrackedParcel | null> {
    const row = await this.prisma.shipment.findUnique({
      where: { publicCode },
      select: PARCEL_FIELDS,
    });
    return row ? toParcel(row) : null;
  }

  async stopDeskNearby(carrier: string, wilayaCode: number | null): Promise<boolean> {
    if (wilayaCode === null) return false;
    const desk = await this.prisma.stopDesk.findFirst({
      where: { carrier, isActive: true, commune: { wilayaCode } },
      select: { id: true },
    });
    return desk !== null;
  }

  async forParcel(shipmentId: string) {
    const rows = await this.prisma.deliveryRequest.findMany({
      where: { shipmentId },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_LIMIT,
    });
    return rows.map(toPublic);
  }

  async create(
    { id, parcel, request, createdAt }: NewDeliveryRequest,
    outbox: readonly OutboxMessage[],
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.deliveryRequest.create({
        data: {
          id,
          storeId: parcel.storeId,
          shipmentId: parcel.id,
          kind: request.kind,
          details: request,
          createdAt,
        },
      });
      await writeOutbox(tx, outbox);
    });
  }

  async list(storeId: string, query: ListDeliveryRequestsQuery): Promise<DeliveryRequest[]> {
    const rows = await this.prisma.deliveryRequest.findMany({
      where: {
        storeId,
        ...(query.state ? { state: query.state } : {}),
        ...(query.orderId ? { shipment: { orderId: query.orderId } } : {}),
      },
      include: WITH_SHIPMENT,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit,
    });
    return rows.map(toSeller);
  }

  async setState({ storeId, id, state, userId, at }: StateChange) {
    const { count } = await this.prisma.deliveryRequest.updateMany({
      where: { id, storeId, state: 'pending' },
      data: { state, handledAt: at, handledBy: userId },
    });
    if (count === 0) return null;
    const row = await this.prisma.deliveryRequest.findUniqueOrThrow({
      where: { id },
      include: WITH_SHIPMENT,
    });
    return toSeller(row);
  }
}
