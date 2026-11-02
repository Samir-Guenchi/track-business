import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  type EventEnvelope,
  type NotificationTrigger,
  OrderStatusChangedEventSchema,
  ShipmentCreatedEventSchema,
  ShipmentStatusChangedEventSchema,
} from '@trackecom/contracts';
import { type SettingsStore, STORES } from '../../messages/application/ports/stores.js';
import { sendTime } from '../../messages/domain/quiet-hours.js';
import { orderTrigger, parcelTrigger } from '../domain/triggers.js';
import { DELIVERY_PORTS, type MessageQueue, type ParcelDirectory } from './ports/delivery.ports.js';

/** One consumer group reads every event notifications cares about. */
export const DELIVERY_CONSUMER = 'notifications.delivery';

interface Target {
  readonly trigger: NotificationTrigger;
  readonly orderId: string;
  readonly shipmentId: string | null;
}

/** Turns order and parcel events into queued messages (#46), once per event and trigger. */
@Injectable()
export class EnqueueMessages {
  constructor(
    @Inject(DELIVERY_PORTS.queue) private readonly queue: MessageQueue,
    @Inject(STORES.settings) private readonly settings: SettingsStore,
    @Inject(DELIVERY_PORTS.parcels) private readonly parcels: ParcelDirectory,
  ) {}

  async orderStatusChanged(event: EventEnvelope): Promise<void> {
    const data = OrderStatusChangedEventSchema.parse(event.data);
    const trigger = orderTrigger(data.to);
    if (trigger) await this.enqueue(event, { trigger, orderId: data.orderId, shipmentId: null });
  }

  async shipmentCreated(event: EventEnvelope): Promise<void> {
    const data = ShipmentCreatedEventSchema.parse(event.data);
    const { shipmentId, orderId, carrier, publicCode } = data;
    await this.parcels.save({ shipmentId, storeId: event.storeId, orderId, carrier, publicCode });
    await this.enqueue(event, { trigger: 'parcel_shipped', orderId, shipmentId });
  }

  async parcelStatusChanged(event: EventEnvelope): Promise<void> {
    const data = ShipmentStatusChangedEventSchema.parse(event.data);
    const trigger = parcelTrigger(data.to);
    if (trigger)
      await this.enqueue(event, { trigger, orderId: data.orderId, shipmentId: data.shipmentId });
  }

  private async enqueue(event: EventEnvelope, target: Target): Promise<void> {
    const { storeId } = event;
    const settings = await this.settings.get(storeId);
    if (!settings.enabled || !settings.triggers.includes(target.trigger)) return;
    const now = new Date();
    await this.queue.enqueue({
      id: randomUUID(),
      storeId,
      ...target,
      channel: settings.channel,
      language: settings.language,
      sourceEventId: event.id,
      sendAfter: sendTime(now, settings.quietHours),
      queuedAt: now,
    });
  }
}
