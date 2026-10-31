/** Normalised parcel status shared by every carrier. Carrier-specific codes map onto these. */
export type ParcelStatus =
  | 'created'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed_attempt'
  | 'returning'
  | 'returned';

export interface CreateShipmentInput {
  readonly orderId: string;
  readonly wilayaCode: number;
  readonly commune: string;
  readonly isStopDesk: boolean;
  readonly codAmountDzd: number;
}

export interface CreatedShipment {
  readonly trackingNumber: string;
  readonly labelUrl: string | null;
}

/**
 * Every carrier integration implements this port (see #30, #40).
 * Adding a carrier = a new class + one registry line; no existing code changes.
 */
export interface CarrierAdapter {
  readonly code: string;
  createShipment(input: CreateShipmentInput): Promise<CreatedShipment>;
  getStatus(trackingNumber: string): Promise<ParcelStatus>;
}
