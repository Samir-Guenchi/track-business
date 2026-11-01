import { describe, expect, it } from 'vitest';
import { createShipmentOnce } from '../create-shipment-once.js';
import type { FetchLike } from '../http/carrier-http.js';
import type { ShipmentRequest } from '../shipment.types.js';
import { carrierContract } from '../contract/carrier-contract.testkit.js';
import { YalidineAdapter } from './yalidine.adapter.js';
import { yalidineHarness } from './yalidine-fake-api.testkit.js';

// Synthetic responses shaped like Yalidine's public docs, with test names only. Replace with
// responses recorded from a sandbox account (personal data scrubbed) before going live.
const ctx = { credentials: { apiId: 'test-id', apiToken: 'test-token' } };
const request: ShipmentRequest = {
  reference: 'TE-ABC123-1',
  recipient: {
    name: 'Client Test Exemple',
    phone: '+213555000001',
    phone2: null,
    address: 'Rue des tests',
  },
  origin: { wilayaCode: 16, wilayaName: 'Alger' },
  wilayaCode: 31,
  communeId: 3101,
  wilayaName: 'Oran',
  communeName: 'Es Senia',
  deliveryType: 'home',
  stopDeskCode: null,
  codAmount: 5600,
  declaredValue: 5000,
  weightGrams: 1200,
  contents: '2 x Robe',
  notes: null,
  fragile: false,
  canOpen: true,
};

interface Call {
  method: string;
  url: URL;
  headers: Record<string, string>;
  body: unknown;
}

function fakeYalidine(routes: Record<string, (call: Call) => [number, unknown]>) {
  const calls: Call[] = [];
  const fetch: FetchLike = async (url, init) => {
    const call = {
      method: init.method ?? 'GET',
      url: new URL(url),
      headers: init.headers as Record<string, string>,
      body: init.body ? JSON.parse(String(init.body)) : undefined,
    };
    calls.push(call);
    const route = routes[`${call.method} ${call.url.pathname}`];
    const [status, body] = route ? route(call) : [404, {}];
    return new Response(JSON.stringify(body), { status });
  };
  return { adapter: new YalidineAdapter({ fetch }), calls };
}

describe('YalidineAdapter', () => {
  it('sends credentials as headers and checks them on a cheap endpoint', async () => {
    const ok = fakeYalidine({
      'GET /v1/wilayas/': () => [200, { has_more: false, total_data: 0, data: [] }],
    });
    const refused = fakeYalidine({ 'GET /v1/wilayas/': () => [401, {}] });

    expect(await ok.adapter.validateCredentials(ctx)).toBe(true);
    expect(ok.calls[0]?.headers).toMatchObject({
      'X-API-ID': 'test-id',
      'X-API-TOKEN': 'test-token',
    });
    expect(await refused.adapter.validateCredentials(ctx)).toBe(false);
  });

  it('creates a parcel in Yalidine format with our reference as order id', async () => {
    const { adapter, calls } = fakeYalidine({
      'POST /v1/parcels/': () => [
        200,
        {
          'TE-ABC123-1': {
            success: true,
            order_id: 'TE-ABC123-1',
            tracking: 'yal-TEST01',
            label: 'https://label.test/1.pdf',
            message: '',
          },
        },
      ],
    });

    const shipment = await adapter.createShipment(ctx, request);

    expect(shipment).toEqual({
      trackingNumber: 'yal-TEST01',
      labelUrl: 'https://label.test/1.pdf',
    });
    expect(calls[0]?.body).toEqual([
      expect.objectContaining({
        order_id: 'TE-ABC123-1',
        from_wilaya_name: 'Alger',
        firstname: 'Client',
        familyname: 'Test Exemple',
        contact_phone: '0555000001',
        to_wilaya_name: 'Oran',
        to_commune_name: 'Es Senia',
        price: 5600,
        weight: 2,
        is_stopdesk: false,
      }),
    ]);
  });

  it('finds a parcel a timed-out create already made, so it is never created twice', async () => {
    let creates = 0;
    const { adapter } = fakeYalidine({
      'POST /v1/parcels/': () => {
        creates += 1;
        return [504, {}];
      },
      'GET /v1/parcels/': (call) => [
        200,
        {
          has_more: false,
          total_data: 1,
          data: [
            {
              tracking: 'yal-TEST02',
              order_id: call.url.searchParams.get('order_id'),
              label: null,
              last_status: 'En préparation',
            },
          ],
        },
      ],
    });
    const options = {
      attempts: 3,
      baseDelayMs: 1,
      maxDelayMs: 1,
      sleep: async () => {},
      random: () => 0,
    };

    const shipment = await createShipmentOnce({ adapter, ctx, request }, options);

    expect(shipment.trackingNumber).toBe('yal-TEST02');
    expect(creates).toBe(1);
  });

  it('turns the history into our timeline, oldest first, keeping unknown labels raw', async () => {
    const { adapter } = fakeYalidine({
      'GET /v1/histories/': () => [
        200,
        {
          has_more: false,
          total_data: 3,
          data: [
            {
              date_status: '2026-11-02 10:00:00',
              tracking: 'yal-1',
              status: 'Tentative échouée',
              reason: 'Client absent',
              center_name: null,
              commune_name: 'Es Senia',
              wilaya_name: 'Oran',
            },
            {
              date_status: '2026-11-01 09:00:00',
              tracking: 'yal-1',
              status: 'Expédié',
              reason: null,
              center_name: 'Agence Alger',
              commune_name: null,
              wilaya_name: null,
            },
            {
              date_status: '2026-11-02 08:00:00',
              tracking: 'yal-1',
              status: 'Bloqué douane',
              reason: null,
              center_name: null,
              commune_name: null,
              wilaya_name: null,
            },
          ],
        },
      ],
    });

    const { events } = await adapter.getTracking(ctx, 'yal-1');

    expect(events.map((event) => [event.status, event.rawStatus])).toEqual([
      ['picked_up', 'Expédié'],
      [null, 'Bloqué douane'],
      ['failed_attempt', 'Tentative échouée'],
    ]);
    expect(events[2]).toMatchObject({ failureReason: 'absent', location: 'Es Senia' });
    expect(events[0]?.at.toISOString()).toBe('2026-11-01T08:00:00.000Z');
  });

  it('pages through stop desks', async () => {
    const { adapter } = fakeYalidine({
      'GET /v1/centers/': (call) => {
        const page = Number(call.url.searchParams.get('page'));
        const center = {
          center_id: page,
          name: `Desk ${page}`,
          address: 'Adresse',
          commune_name: 'Commune',
          wilaya_id: 16,
        };
        return [200, { has_more: page < 2, total_data: 2, data: [center] }];
      },
    });

    expect((await adapter.listStopDesks(ctx)).map((desk) => desk.code)).toEqual(['1', '2']);
  });

  it('reports rate limits as retryable, with the wait the carrier asked for', async () => {
    const fetch: FetchLike = async () =>
      new Response('{}', { status: 429, headers: { 'retry-after': '3' } });
    const adapter = new YalidineAdapter({ fetch });

    await expect(adapter.findShipment(ctx, 'x')).rejects.toMatchObject({
      kind: 'rate_limited',
      retryable: true,
      details: { retryAfterMs: 3000 },
    });
  });
});

carrierContract('YalidineAdapter', () => yalidineHarness(request));
