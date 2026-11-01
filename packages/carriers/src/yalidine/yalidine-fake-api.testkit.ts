import type { CarrierHarness } from '../contract/carrier-contract.testkit.js';
import type { FetchLike } from '../http/carrier-http.js';
import type { ShipmentRequest } from '../shipment.types.js';
import { YalidineAdapter } from './yalidine.adapter.js';

// Synthetic, shaped like Yalidine's public docs, with test names only. Replace with responses
// recorded from a sandbox account (personal data scrubbed) before going live.
const CREDENTIALS = { apiId: 'test-id', apiToken: 'test-token' };
const TRACKED = 'yal-TRACKED';
const HISTORY = [
  { date_status: '2026-11-02 10:00:00', status: 'Livré', reason: null },
  { date_status: '2026-11-01 09:00:00', status: 'Expédié', reason: null },
].map((row) => ({
  ...row,
  tracking: TRACKED,
  center_name: null,
  commune_name: null,
  wilaya_name: null,
}));

type Parcel = { order_id: string; tracking: string; label: string; last_status: string };
type Reply = [number, unknown];

const page = (data: unknown[]): Reply => [200, { has_more: false, total_data: data.length, data }];

/** An in-memory Yalidine: parcels by our reference, one tracked parcel, header auth. */
class FakeYalidineApi {
  private readonly parcels = new Map<string, Parcel>();
  private failNextCreate = false;

  failNextCreateAfterSaving(): void {
    this.failNextCreate = true;
  }

  readonly fetch: FetchLike = async (url, init) => {
    const headers = init.headers as Record<string, string>;
    const authorized =
      headers['X-API-ID'] === CREDENTIALS.apiId && headers['X-API-TOKEN'] === CREDENTIALS.apiToken;
    const [status, body] = authorized
      ? this.route(init.method ?? 'GET', new URL(url), init.body)
      : [401, {}];
    return new Response(JSON.stringify(body), { status });
  };

  private route(method: string, url: URL, body: unknown): Reply {
    const path = url.pathname.replace(/^\/v1\//, '');
    const tracking = /^parcels\/(.+)$/.exec(path)?.[1];
    if (tracking) return this.parcelRoute(method, decodeURIComponent(tracking));
    const routes: Record<string, () => Reply> = {
      'POST parcels/': () => this.create(String(body)),
      'GET parcels/': () => page(this.byReference(url)),
      'GET histories/': () => page(HISTORY),
      'GET wilayas/': () => page([]),
    };
    return routes[`${method} ${path}`]?.() ?? [404, {}];
  }

  private parcelRoute(method: string, tracking: string): Reply {
    if (method === 'DELETE') return [200, { deleted: true }];
    return page([...this.parcels.values()].filter((parcel) => parcel.tracking === tracking));
  }

  private create(body: string): Reply {
    const [parcel] = JSON.parse(body) as { order_id: string }[];
    const reference = parcel?.order_id ?? '';
    const tracking = `yal-${this.parcels.size + 1}`;
    const label = `https://label.test/${tracking}.pdf`;
    this.parcels.set(reference, {
      order_id: reference,
      tracking,
      label,
      last_status: 'En préparation',
    });
    if (this.failNextCreate) {
      this.failNextCreate = false;
      return [504, {}];
    }
    const result = { success: true, order_id: reference, tracking, label, message: '' };
    return [200, { [reference]: result }];
  }

  private byReference(url: URL): Parcel[] {
    const parcel = this.parcels.get(url.searchParams.get('order_id') ?? '');
    return parcel ? [parcel] : [];
  }
}

/** A fresh Yalidine adapter on its fake API, for the shared carrier contract. */
export function yalidineHarness(request: ShipmentRequest): CarrierHarness {
  const api = new FakeYalidineApi();
  return {
    adapter: new YalidineAdapter({ fetch: api.fetch }),
    ctx: { credentials: CREDENTIALS },
    badCtx: { credentials: { ...CREDENTIALS, apiToken: 'wrong' } },
    request,
    trackedNumber: TRACKED,
    failNextCreateAfterSaving: () => api.failNextCreateAfterSaving(),
  };
}
