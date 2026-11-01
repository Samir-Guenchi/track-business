import { PARCEL_STATUSES } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import type { CarrierAdapter } from '../carrier-adapter.port.js';
import { CarrierError } from '../carrier.errors.js';
import { createShipmentOnce } from '../create-shipment-once.js';
import type { CarrierContext, ShipmentRequest, WebhookRequest } from '../shipment.types.js';

/**
 * Everything the shared suite needs to drive one adapter against its fake API. Each adapter's
 * spec builds a fresh harness per test, backed by recorded or synthetic responses.
 */
export interface CarrierHarness {
  readonly adapter: CarrierAdapter;
  readonly ctx: CarrierContext;
  /** Credentials the fake API refuses. */
  readonly badCtx: CarrierContext;
  readonly request: ShipmentRequest;
  /** A parcel the fake API has a scan history for. */
  readonly trackedNumber: string;
  /** The next create saves the parcel and then times out, like a real carrier under load. */
  failNextCreateAfterSaving(): void;
  /** Required when the adapter declares webhooks. */
  readonly webhooks?: { readonly signed: WebhookRequest; readonly forged: WebhookRequest };
}

const STATUSES: readonly (string | null)[] = [...PARCEL_STATUSES, null];
const NO_RETRY_WAIT = {
  attempts: 3,
  baseDelayMs: 1,
  maxDelayMs: 1,
  sleep: async () => {},
  random: () => 0,
};

const rejectsWith = async (call: Promise<unknown>, kind?: string) => {
  const error: unknown = await call.then(
    () => null,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(CarrierError);
  if (kind) expect(error).toMatchObject({ kind });
};

/** Who the adapter says it is, and how it treats credentials. */
function identityChecks(harness: () => CarrierHarness): void {
  it('names itself and the fields a seller fills', () => {
    const { adapter } = harness();
    const keys = adapter.credentialFields.map((field) => field.key);

    expect(adapter.code).toMatch(/^[a-z][a-z0-9-]*$/);
    expect(keys.length).toBeGreaterThan(0);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('answers true or false for credentials, never throws for wrong ones', async () => {
    const { adapter, ctx, badCtx } = harness();

    expect(await adapter.validateCredentials(ctx)).toBe(true);
    expect(await adapter.validateCredentials(badCtx)).toBe(false);
  });
}

/** Parcels: created once, found by our reference, tracked in order. */
function parcelChecks(harness: () => CarrierHarness): void {
  it('creates a parcel and finds it again by our reference', async () => {
    const { adapter, ctx, request } = harness();
    const created = await adapter.createShipment(ctx, request);

    expect(created.trackingNumber).not.toBe('');
    if (!adapter.capabilities.findByReference) return;
    expect(await adapter.findShipment(ctx, request.reference)).toMatchObject({
      trackingNumber: created.trackingNumber,
    });
    expect(await adapter.findShipment(ctx, `${request.reference}-unknown`)).toBeNull();
  });

  it('never creates a parcel twice when a create times out after saving', async () => {
    const subject = harness();
    if (!subject.adapter.capabilities.findByReference) return;
    subject.failNextCreateAfterSaving();

    const first = await createShipmentOnce(subject, NO_RETRY_WAIT);

    expect(await subject.adapter.findShipment(subject.ctx, subject.request.reference)).toEqual(
      first,
    );
  });

  it('returns scans oldest first, each mapped or kept raw', async () => {
    const { adapter, ctx, trackedNumber } = harness();
    const { events } = await adapter.getTracking(ctx, trackedNumber);
    const times = events.map((event) => event.at.getTime());

    expect(events.length).toBeGreaterThan(0);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    for (const event of events) {
      expect(STATUSES).toContain(event.status);
      expect(event.rawStatus).not.toBe('');
    }
  });
}

/** What it declares it can do matches what it does. */
function capabilityChecks(harness: () => CarrierHarness): void {
  it('refuses forged webhooks and reads signed ones, or says it has none', async () => {
    const { adapter, ctx, webhooks } = harness();
    if (!adapter.capabilities.webhooks || !webhooks) {
      expect(adapter.capabilities.webhooks).toBe(false);
      return rejectsWith(adapter.parseWebhook(ctx, { headers: {}, rawBody: '' }), 'not_supported');
    }
    await rejectsWith(adapter.parseWebhook(ctx, webhooks.forged), 'auth');
    expect(Array.isArray(await adapter.parseWebhook(ctx, webhooks.signed))).toBe(true);
  });

  it('cancels and prints labels only when it says it can', async () => {
    const { adapter, ctx, request } = harness();
    const { trackingNumber } = await adapter.createShipment(ctx, request);

    if (adapter.capabilities.labels) {
      const label = await adapter.getLabel(ctx, trackingNumber);
      expect(label.url ?? label.body).toBeTruthy();
    } else {
      await rejectsWith(adapter.getLabel(ctx, trackingNumber));
    }
    if (adapter.capabilities.cancel) await adapter.cancelShipment(ctx, trackingNumber);
  });

  it('says when it has no rates instead of inventing them', async () => {
    const { adapter, ctx } = harness();
    if (adapter.capabilities.rates) {
      expect((await adapter.getRates(ctx, 16)).length).toBeGreaterThan(0);
      return;
    }
    const rates = await adapter.getRates(ctx, 16).catch((error: unknown) => {
      expect(error).toMatchObject({ kind: 'not_supported' });
      return [];
    });
    expect(rates).toEqual([]);
  });
}

/**
 * The behaviour every carrier adapter must show, whatever the carrier (#40). Run it from the
 * adapter's spec: `carrierContract('Yalidine', () => yalidineHarness())`.
 */
export function carrierContract(name: string, harness: () => CarrierHarness): void {
  describe(`${name} meets the carrier contract`, () => {
    identityChecks(harness);
    parcelChecks(harness);
    capabilityChecks(harness);
  });
}
