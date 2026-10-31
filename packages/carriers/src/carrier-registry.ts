import type { CarrierAdapter } from './carrier-adapter.port.js';

export class UnknownCarrierError extends Error {
  readonly code = 'carrier.unknown';

  constructor(carrierCode: string) {
    super(`No adapter registered for carrier "${carrierCode}"`);
  }
}

/** Looks adapters up by code so callers never switch on carrier names. */
export class CarrierRegistry {
  private readonly adapters: ReadonlyMap<string, CarrierAdapter>;

  constructor(adapters: readonly CarrierAdapter[]) {
    this.adapters = new Map(adapters.map((adapter) => [adapter.code, adapter]));
  }

  get(carrierCode: string): CarrierAdapter {
    const adapter = this.adapters.get(carrierCode);
    if (!adapter) throw new UnknownCarrierError(carrierCode);
    return adapter;
  }

  codes(): string[] {
    return [...this.adapters.keys()];
  }
}
