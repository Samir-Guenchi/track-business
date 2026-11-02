import type { CarrierAdapter } from './carrier-adapter.port.js';
import { DEFAULT_RETRY, type RetryOptions, withRetry } from './retry.js';
import type { CarrierContext, CreatedShipment, ShipmentRequest } from './shipment.types.js';

/**
 * Creates a parcel without ever creating it twice. Before every retry (a timeout may have
 * created the parcel anyway) it asks the carrier for the reference. Carriers that cannot be
 * searched by reference are tried once: a duplicate parcel costs the seller real money,
 * a failed create only needs a click on "retry".
 */
export function createShipmentOnce(
  call: { adapter: CarrierAdapter; ctx: CarrierContext; request: ShipmentRequest },
  options: RetryOptions = DEFAULT_RETRY,
): Promise<CreatedShipment> {
  const { adapter, ctx, request } = call;
  if (!adapter.capabilities.findByReference) return adapter.createShipment(ctx, request);
  return withRetry(async (attempt) => {
    if (attempt > 0) {
      const existing = await adapter.findShipment(ctx, request.reference);
      if (existing) return existing;
    }
    return adapter.createShipment(ctx, request);
  }, options);
}
