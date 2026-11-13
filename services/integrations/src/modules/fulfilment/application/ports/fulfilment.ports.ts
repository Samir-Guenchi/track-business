import type { OrderOrigin } from '@trackecom/contracts';
import type { ConnectionRecord } from '../../../connections/application/ports/connection.repository.js';

export const FULFILMENT_PORTS = {
  origins: Symbol('OrderOrigins'),
  targets: Symbol('FulfilmentTargets'),
} as const;

/** Asks orders where an order came from; null when orders does not know it. */
export interface OrderOrigins {
  originOf(storeId: string, orderId: string): Promise<OrderOrigin | null>;
}

export interface FulfilmentTarget {
  readonly connection: ConnectionRecord;
  readonly externalId: string;
}

/** The shop an imported order came from, and the bus inbox for this consumer. */
export interface FulfilmentTargets {
  find(origin: {
    storeId: string;
    connector: string;
    externalId: string;
  }): Promise<FulfilmentTarget | null>;
  alreadyDone(eventId: string): Promise<boolean>;
  markDone(eventId: string): Promise<void>;
  /** The shop refused our token: the seller must reconnect it. */
  needsReconnect(connection: ConnectionRecord): Promise<void>;
}
