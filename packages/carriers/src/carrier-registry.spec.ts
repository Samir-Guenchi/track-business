import { describe, expect, it } from 'vitest';
import type { CarrierAdapter } from './carrier-adapter.port.js';
import { CarrierRegistry, UnknownCarrierError } from './carrier-registry.js';

const fakeCarrier = (code: string): CarrierAdapter => ({
  code,
  createShipment: async () => ({ trackingNumber: `${code}-1`, labelUrl: null }),
  getStatus: async () => 'in_transit',
});

describe('CarrierRegistry', () => {
  it('returns the adapter registered for a carrier code', () => {
    const registry = new CarrierRegistry([fakeCarrier('alpha'), fakeCarrier('beta')]);

    expect(registry.get('beta').code).toBe('beta');
  });

  it('throws a typed error for an unknown carrier', () => {
    const registry = new CarrierRegistry([fakeCarrier('alpha')]);

    expect(() => registry.get('gamma')).toThrow(UnknownCarrierError);
  });
});
