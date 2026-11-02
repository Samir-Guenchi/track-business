import type { CredentialField } from '@trackecom/contracts';
import type {
  CarrierContext,
  CarrierLabel,
  CarrierRate,
  CarrierStopDesk,
  CreatedShipment,
  ShipmentRequest,
  TrackingUpdate,
  WebhookRequest,
} from './shipment.types.js';

/** What a carrier offers; callers check this instead of catching "not supported" errors. */
export interface CarrierCapabilities {
  readonly webhooks: boolean;
  readonly cancel: boolean;
  readonly labels: boolean;
  readonly rates: boolean;
  /** Can find a parcel by our reference, which makes create safe to retry. */
  readonly findByReference: boolean;
}

/**
 * Every carrier integration implements this port (#30, #40). Adapters are stateless: credentials
 * come in through the context on every call. They throw CarrierError, never raw HTTP errors.
 * Adding a carrier = a new adapter class + one registry line; no existing code changes.
 */
export interface CarrierAdapter {
  readonly code: string;
  /** Display name, e.g. "Yalidine". */
  readonly name: string;
  /** What the seller types to connect their account; keys of CarrierContext.credentials. */
  readonly credentialFields: readonly CredentialField[];
  readonly capabilities: CarrierCapabilities;

  validateCredentials(ctx: CarrierContext): Promise<boolean>;
  getRates(ctx: CarrierContext, fromWilaya: number): Promise<CarrierRate[]>;
  createShipment(ctx: CarrierContext, request: ShipmentRequest): Promise<CreatedShipment>;
  /** null when the carrier has no parcel for this reference. */
  findShipment(ctx: CarrierContext, reference: string): Promise<CreatedShipment | null>;
  cancelShipment(ctx: CarrierContext, trackingNumber: string): Promise<void>;
  getLabel(ctx: CarrierContext, trackingNumber: string): Promise<CarrierLabel>;
  getTracking(ctx: CarrierContext, trackingNumber: string): Promise<TrackingUpdate>;
  /** Verifies the signature (CarrierError 'auth' when wrong) and returns the updates inside. */
  parseWebhook(ctx: CarrierContext, request: WebhookRequest): Promise<TrackingUpdate[]>;
  listStopDesks(ctx: CarrierContext): Promise<CarrierStopDesk[]>;
  /** The carrier's id or name for one of our communes; null when it does not deliver there. */
  mapCommune(ctx: CarrierContext, communeId: number): Promise<string | null>;
}
