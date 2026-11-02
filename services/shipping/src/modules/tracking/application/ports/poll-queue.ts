export interface DueShipment {
  readonly id: string;
  readonly storeId: string;
  readonly carrier: string;
  readonly trackingNumber: string;
}

/** Shipments whose `nextPollAt` has passed. Claiming leases them so replicas never share one. */
export interface ShipmentPollQueue {
  /** Takes up to `limit` due shipments and pushes their next poll `leaseMs` away (database time). */
  claimDue(input: { limit: number; leaseMs: number }): Promise<DueShipment[]>;
  postpone(shipmentId: string, delayMs: number): Promise<void>;
}

export const SHIPMENT_POLL_QUEUE = Symbol('ShipmentPollQueue');
