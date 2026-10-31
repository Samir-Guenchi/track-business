import type { OutboxMessage } from '../../../../shared/outbox-message.js';

export interface NewShipment {
  readonly id: string;
  readonly storeId: string;
  readonly orderId: string;
  readonly carrier: string;
  readonly reference: string;
  readonly trackingNumber: string;
  /** Destination wilaya, for delivery rates per carrier and wilaya (#41). */
  readonly toWilayaCode: number;
  readonly publicCode: string;
  readonly nextPollAt: Date;
}

export interface ShipmentRepository {
  exists(storeId: string, reference: string): Promise<boolean>;
  /** Saves the shipment and its created event together; false if the reference already exists. */
  create(shipment: NewShipment, outbox: readonly OutboxMessage[]): Promise<boolean>;
  /** Records a failed request: only its outbox event, nothing else is stored. */
  recordFailure(outbox: readonly OutboxMessage[]): Promise<void>;
}

export const SHIPMENT_REPOSITORY = Symbol('ShipmentRepository');
