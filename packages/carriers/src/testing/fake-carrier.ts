import type { CarrierAdapter, CarrierCapabilities } from '../carrier-adapter.port.js';
import { CarrierError } from '../carrier.errors.js';
import type { CreatedShipment, ShipmentRequest, TrackingUpdate } from '../shipment.types.js';

export interface FakeCarrierOptions {
  readonly code?: string;
  readonly capabilities?: Partial<CarrierCapabilities>;
  /** Number of create calls that fail with `unavailable`. */
  readonly failCreates?: number;
  /** When true, a failing create still stores the parcel (a timeout after the carrier saved it). */
  readonly createdDespiteFailure?: boolean;
}

/**
 * In-memory carrier for tests and local development. Behaves like a real one where it matters:
 * parcels are stored by reference, creates can fail after (or before) saving.
 */
export class FakeCarrier implements CarrierAdapter {
  readonly code: string;
  readonly name = 'Fake carrier';
  readonly credentialFields = [{ key: 'token', label: 'Token', secret: true }];
  readonly capabilities: CarrierCapabilities;
  readonly parcels = new Map<string, CreatedShipment & { request: ShipmentRequest }>();
  createCalls = 0;
  private failuresLeft: number;

  constructor(private readonly options: FakeCarrierOptions = {}) {
    this.code = options.code ?? 'fake';
    this.capabilities = {
      webhooks: false,
      cancel: true,
      labels: false,
      rates: false,
      findByReference: true,
      ...options.capabilities,
    };
    this.failuresLeft = options.failCreates ?? 0;
  }

  async validateCredentials(ctx: { credentials: Record<string, string> }) {
    return ctx.credentials['token'] === 'valid';
  }

  async createShipment(_ctx: unknown, request: ShipmentRequest): Promise<CreatedShipment> {
    this.createCalls += 1;
    const failing = this.failuresLeft > 0;
    this.failuresLeft -= 1;
    if (failing && !this.options.createdDespiteFailure) throw this.outage();
    const shipment = {
      trackingNumber: `${this.code.toUpperCase()}-${this.parcels.size + 1}`,
      labelUrl: null,
    };
    this.parcels.set(request.reference, { ...shipment, request });
    if (failing) throw this.outage();
    return shipment;
  }

  async findShipment(_ctx: unknown, reference: string) {
    const parcel = this.parcels.get(reference);
    return parcel ? { trackingNumber: parcel.trackingNumber, labelUrl: parcel.labelUrl } : null;
  }

  async getTracking(_ctx: unknown, trackingNumber: string): Promise<TrackingUpdate> {
    return { trackingNumber, events: [] };
  }

  async cancelShipment() {}
  async getRates() {
    return [];
  }
  async getLabel(): Promise<never> {
    throw new CarrierError('not_supported', 'No labels', { carrier: this.code });
  }
  async parseWebhook() {
    return [];
  }
  async listStopDesks() {
    return [];
  }
  async mapCommune(_ctx: unknown, communeId: number) {
    return String(communeId);
  }

  private outage() {
    return new CarrierError('unavailable', 'Carrier timed out', {
      carrier: this.code,
      status: 504,
    });
  }
}
