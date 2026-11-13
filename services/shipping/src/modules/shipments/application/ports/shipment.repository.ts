import type { DeliveryType } from '@trackecom/contracts';
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
  /** Which choices the customer gets on the tracking page (#136). */
  readonly deliveryType: DeliveryType;
  /** Exchanges (#138): what the courier takes back, so the return chain expects it. */
  readonly exchangeCollect: string | null;
  readonly publicCode: string;
  readonly nextPollAt: Date;
}

export interface ShipmentRepository {
  exists(storeId: string, reference: string): Promise<boolean>;
  /** Saves the shipment and its created event together; false if the reference already exists. */
  create(shipment: NewShipment, outbox: readonly OutboxMessage[]): Promise<boolean>;
  /** Records a failed request: only its outbox event, nothing else is stored. */
  recordFailure(outbox: readonly OutboxMessage[]): Promise<void>;
  /** The carrier's code for a desk given by our id or by its carrier code; null if unknown. */
  stopDeskCode(carrier: string, stopDeskId: string): Promise<string | null>;
}

export const SHIPMENT_REPOSITORY = Symbol('ShipmentRepository');
