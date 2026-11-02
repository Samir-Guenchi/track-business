import type { DeliveryType, FailedAttemptReason, ParcelStatus } from '@trackecom/contracts';

/** Normalised parcel status, defined once in the contracts (carrier labels map onto it). */
export type { ParcelStatus } from '@trackecom/contracts';

/** Decrypted per-store credentials, shaped by each carrier (token, key, tenant id...). */
export type CarrierCredentials = Readonly<Record<string, string>>;

/** Passed to every call: never stored by the adapter, so adapters stay stateless. */
export interface CarrierContext {
  readonly credentials: CarrierCredentials;
  readonly signal?: AbortSignal;
}

export interface ShipmentRequest {
  /**
   * Our stable reference for this shipment (order ref + attempt). Sent to the carrier as its
   * order id, so a retried create can be found instead of creating a second parcel.
   */
  readonly reference: string;
  readonly recipient: {
    readonly name: string;
    /** E.164 (+213...). */
    readonly phone: string;
    readonly phone2: string | null;
    readonly address: string | null;
  };
  /** Where the parcel leaves from (the store's warehouse or drop-off wilaya). */
  readonly origin: { readonly wilayaCode: number; readonly wilayaName: string };
  readonly wilayaCode: number;
  readonly communeId: number;
  /** French names from our geo data; some carriers (Yalidine) identify places by name. */
  readonly wilayaName: string;
  readonly communeName: string;
  readonly deliveryType: DeliveryType;
  /** Carrier's own stop-desk code, required for stop-desk delivery. */
  readonly stopDeskCode: string | null;
  /** What the customer pays on delivery, in DZD. */
  readonly codAmount: number;
  readonly declaredValue: number;
  readonly weightGrams: number | null;
  /** Short description printed on the label, e.g. "2 x Robe". */
  readonly contents: string;
  readonly notes: string | null;
  readonly fragile: boolean;
  /** The customer may open the parcel before paying. */
  readonly canOpen: boolean;
}

export interface CreatedShipment {
  readonly trackingNumber: string;
  readonly labelUrl: string | null;
}

export interface CarrierRate {
  readonly fromWilaya: number;
  readonly toWilaya: number;
  readonly deliveryType: DeliveryType;
  readonly price: number;
  readonly returnFee: number;
  readonly weightLimitGrams: number | null;
}

export interface TrackingEvent {
  /** null when the carrier's label is not mapped yet; the raw label is kept and alerted (#32). */
  readonly status: ParcelStatus | null;
  /** The carrier's own wording, kept for support and for new codes we do not map yet. */
  readonly rawStatus: string;
  readonly at: Date;
  readonly location: string | null;
  readonly note: string | null;
  readonly failureReason: FailedAttemptReason | null;
}

export interface TrackingUpdate {
  readonly trackingNumber: string;
  readonly events: readonly TrackingEvent[];
}

export interface CarrierStopDesk {
  readonly code: string;
  readonly name: string;
  readonly wilayaCode: number;
  readonly communeName: string;
  readonly address: string;
}

export interface CarrierLabel {
  readonly contentType: 'application/pdf' | 'text/html';
  readonly url: string | null;
  readonly body: Uint8Array | null;
}

/** An incoming webhook as the HTTP layer received it; adapters verify and parse it. */
export interface WebhookRequest {
  readonly headers: Readonly<Record<string, string | undefined>>;
  readonly rawBody: string;
}
