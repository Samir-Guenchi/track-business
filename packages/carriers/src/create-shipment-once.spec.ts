import { describe, expect, it } from 'vitest';
import { CarrierError } from './carrier.errors.js';
import { createShipmentOnce } from './create-shipment-once.js';
import { backoffDelay, type RetryOptions, withRetry } from './retry.js';
import type { ShipmentRequest } from './shipment.types.js';
import { FakeCarrier } from './testing/fake-carrier.js';

const delays: number[] = [];
const fast: RetryOptions = {
  attempts: 4,
  baseDelayMs: 100,
  maxDelayMs: 1_000,
  sleep: async (ms) => {
    delays.push(ms);
  },
  random: () => 1,
};
const ctx = { credentials: { token: 'valid' } };
const request = { reference: 'TE-ABC123-1' } as ShipmentRequest;

describe('createShipmentOnce', () => {
  it('retries an outage and returns the parcel', async () => {
    const carrier = new FakeCarrier({ failCreates: 2 });

    const shipment = await createShipmentOnce({ adapter: carrier, ctx, request }, fast);

    expect(shipment.trackingNumber).toBe('FAKE-1');
    expect(carrier.parcels.size).toBe(1);
  });

  it('finds the parcel a timed-out create already made instead of creating a second one', async () => {
    const carrier = new FakeCarrier({ failCreates: 1, createdDespiteFailure: true });

    await createShipmentOnce({ adapter: carrier, ctx, request }, fast);

    expect(carrier.createCalls).toBe(1);
    expect(carrier.parcels.size).toBe(1);
  });

  it('tries once when the carrier cannot be searched by reference', async () => {
    const carrier = new FakeCarrier({ failCreates: 1, capabilities: { findByReference: false } });

    await expect(createShipmentOnce({ adapter: carrier, ctx, request }, fast)).rejects.toThrow(
      CarrierError,
    );
    expect(carrier.createCalls).toBe(1);
  });
});

describe('withRetry', () => {
  it('does not retry errors a person must fix', async () => {
    let calls = 0;
    const call = async () => {
      calls += 1;
      throw new CarrierError('validation', 'Unknown commune');
    };

    await expect(withRetry(call, fast)).rejects.toThrow('Unknown commune');
    expect(calls).toBe(1);
  });

  it('backs off exponentially, capped, and respects Retry-After', () => {
    const outage = new CarrierError('unavailable', 'down');
    const limited = new CarrierError('rate_limited', 'slow down', {
      carrier: 'x',
      retryAfterMs: 5_000,
    });

    expect([0, 1, 2, 5].map((attempt) => backoffDelay(attempt, outage, fast))).toEqual([
      100, 200, 400, 1_000,
    ]);
    expect(backoffDelay(0, limited, fast)).toBe(5_000);
  });
});
