import type { CarrierAdapter } from '../carrier-adapter.port.js';
import { CarrierError } from '../carrier.errors.js';
import { CarrierHttp, type FetchLike } from '../http/carrier-http.js';
import type {
  CarrierContext,
  CarrierLabel,
  CarrierStopDesk,
  CreatedShipment,
  ShipmentRequest,
  TrackingUpdate,
} from '../shipment.types.js';
import { toYalidineParcel } from './yalidine-parcel.js';
import { yalidineFailureReason, yalidineStatus } from './yalidine-statuses.js';
import type {
  YalidineCenter,
  YalidineCreateResult,
  YalidineHistory,
  YalidinePage,
  YalidineParcel,
} from './yalidine.types.js';

const CODE = 'yalidine';
const MAX_CENTER_PAGES = 20;

/**
 * Yalidine (and Yalitec, same platform). Written from the public API description; webhooks and
 * rates stay off until checked against a sandbox (docs/carriers.md).
 */
export class YalidineAdapter implements CarrierAdapter {
  readonly code = CODE;
  readonly name = 'Yalidine';
  readonly credentialFields = [
    { key: 'apiId', label: 'API ID', secret: false },
    { key: 'apiToken', label: 'API token', secret: true },
  ];
  readonly capabilities = {
    webhooks: false,
    cancel: true,
    labels: true,
    rates: false,
    findByReference: true,
  };
  private readonly http: CarrierHttp;

  constructor(options: { fetch?: FetchLike; baseUrl?: string } = {}) {
    this.http = new CarrierHttp({
      carrier: CODE,
      baseUrl: options.baseUrl ?? 'https://api.yalidine.app/v1/',
      ...(options.fetch ? { fetch: options.fetch } : {}),
    });
  }

  async validateCredentials(ctx: CarrierContext): Promise<boolean> {
    try {
      await this.get(ctx, 'wilayas/', { page_size: 1 });
      return true;
    } catch (error) {
      if (error instanceof CarrierError && error.kind === 'auth') return false;
      throw error;
    }
  }

  async createShipment(ctx: CarrierContext, request: ShipmentRequest): Promise<CreatedShipment> {
    const results = await this.http.json<Record<string, YalidineCreateResult>>({
      method: 'POST',
      path: 'parcels/',
      headers: this.auth(ctx),
      body: [toYalidineParcel(request)],
      signal: ctx.signal,
    });
    const result = results[request.reference];
    if (!result?.success || !result.tracking) {
      throw new CarrierError(
        'validation',
        `Yalidine refused the parcel: ${result?.message ?? 'no result'}`,
        { carrier: CODE },
      );
    }
    return { trackingNumber: result.tracking, labelUrl: result.label };
  }

  async findShipment(ctx: CarrierContext, reference: string): Promise<CreatedShipment | null> {
    const page = await this.get<YalidinePage<YalidineParcel>>(ctx, 'parcels/', {
      order_id: reference,
    });
    const parcel = page.data.find((candidate) => candidate.order_id === reference);
    return parcel ? { trackingNumber: parcel.tracking, labelUrl: parcel.label } : null;
  }

  async cancelShipment(ctx: CarrierContext, trackingNumber: string): Promise<void> {
    await this.http.send({
      method: 'DELETE',
      path: `parcels/${encodeURIComponent(trackingNumber)}`,
      headers: this.auth(ctx),
      signal: ctx.signal,
    });
  }

  async getLabel(ctx: CarrierContext, trackingNumber: string): Promise<CarrierLabel> {
    const parcel = await this.get<YalidinePage<YalidineParcel>>(
      ctx,
      `parcels/${encodeURIComponent(trackingNumber)}`,
    );
    const url = parcel.data[0]?.label ?? null;
    if (!url)
      throw new CarrierError('not_found', 'No label for this parcel yet', { carrier: CODE });
    return { contentType: 'application/pdf', url, body: null };
  }

  async getTracking(ctx: CarrierContext, trackingNumber: string): Promise<TrackingUpdate> {
    const page = await this.get<YalidinePage<YalidineHistory>>(ctx, 'histories/', {
      tracking: trackingNumber,
    });
    const events = page.data.map((history) => ({
      status: yalidineStatus(history.status),
      rawStatus: history.status,
      at: new Date(history.date_status.replace(' ', 'T') + '+01:00'),
      location: history.center_name ?? history.commune_name ?? history.wilaya_name,
      note: history.reason,
      failureReason: yalidineFailureReason(history.reason),
    }));
    return { trackingNumber, events: events.sort((a, b) => a.at.getTime() - b.at.getTime()) };
  }

  async listStopDesks(ctx: CarrierContext): Promise<CarrierStopDesk[]> {
    const desks: CarrierStopDesk[] = [];
    for (let page = 1; page <= MAX_CENTER_PAGES; page += 1) {
      const result = await this.get<YalidinePage<YalidineCenter>>(ctx, 'centers/', { page });
      desks.push(
        ...result.data.map((center) => ({
          code: String(center.center_id),
          name: center.name,
          wilayaCode: center.wilaya_id,
          communeName: center.commune_name,
          address: center.address,
        })),
      );
      if (!result.has_more) break;
    }
    return desks;
  }

  async getRates(): Promise<never> {
    throw new CarrierError('not_supported', 'Yalidine rates are not wired yet', { carrier: CODE });
  }

  async parseWebhook(): Promise<never> {
    throw new CarrierError('not_supported', 'Yalidine webhooks are not wired yet', {
      carrier: CODE,
    });
  }

  /** Yalidine identifies communes by name, which ShipmentRequest already carries. */
  async mapCommune(): Promise<null> {
    return null;
  }

  private get<T>(
    ctx: CarrierContext,
    path: string,
    query: Record<string, string | number> = {},
  ): Promise<T> {
    return this.http.json<T>({
      method: 'GET',
      path,
      headers: this.auth(ctx),
      query,
      signal: ctx.signal,
    });
  }

  private auth(ctx: CarrierContext): Record<string, string> {
    const { apiId, apiToken } = ctx.credentials;
    if (!apiId || !apiToken)
      throw new CarrierError('auth', 'Yalidine credentials missing', { carrier: CODE });
    return { 'X-API-ID': apiId, 'X-API-TOKEN': apiToken };
  }
}
