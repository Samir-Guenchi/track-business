import { describe, expect, it } from 'vitest';
import { CarrierRegistry, UnknownCarrierError } from './carrier-registry.js';
import { FakeCarrier } from './testing/fake-carrier.js';

describe('CarrierRegistry', () => {
  it('returns the adapter registered for a carrier code', () => {
    const registry = new CarrierRegistry([
      new FakeCarrier({ code: 'alpha' }),
      new FakeCarrier({ code: 'beta' }),
    ]);

    expect(registry.get('beta').code).toBe('beta');
  });

  it('throws a typed error for an unknown carrier', () => {
    const registry = new CarrierRegistry([new FakeCarrier({ code: 'alpha' })]);

    expect(() => registry.get('gamma')).toThrow(UnknownCarrierError);
  });
});
