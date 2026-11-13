import { CarrierError, kindForStatus } from '../carrier.errors.js';

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export interface CarrierHttpOptions {
  readonly carrier: string;
  readonly baseUrl: string;
  readonly fetch?: FetchLike;
  readonly timeoutMs?: number;
}

export interface CarrierRequest {
  readonly method: 'GET' | 'POST' | 'DELETE';
  readonly path: string;
  readonly headers: Record<string, string>;
  readonly query?: Record<string, string | number>;
  readonly body?: unknown;
  readonly signal?: AbortSignal | undefined;
}

const retryAfterMs = (response: Response): number | undefined => {
  const seconds = Number(response.headers.get('retry-after'));
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : undefined;
};

/**
 * The only way adapters talk to a carrier: fixed base URL (no user-supplied hosts), a timeout on
 * every call, and HTTP failures turned into CarrierError. Response bodies are never put in error
 * messages, since they can contain customer data.
 */
export class CarrierHttp {
  private readonly fetch: FetchLike;

  constructor(private readonly options: CarrierHttpOptions) {
    this.fetch = options.fetch ?? ((url, init) => globalThis.fetch(url, init));
  }

  async json<T>(request: CarrierRequest): Promise<T> {
    const response = await this.send(request);
    return (await response.json()) as T;
  }

  async send(request: CarrierRequest): Promise<Response> {
    const url = new URL(request.path, this.options.baseUrl);
    for (const [key, value] of Object.entries(request.query ?? {}))
      url.searchParams.set(key, String(value));
    const timeout = AbortSignal.timeout(this.options.timeoutMs ?? 15_000);
    const response = await this.fetch(url.toString(), {
      method: request.method,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        ...request.headers,
      },
      signal: request.signal ? AbortSignal.any([request.signal, timeout]) : timeout,
      ...(request.body === undefined ? {} : { body: JSON.stringify(request.body) }),
    }).catch(() => {
      throw new CarrierError('unavailable', `${this.options.carrier} did not answer`, {
        carrier: this.options.carrier,
      });
    });
    if (response.ok) return response;
    const retry = retryAfterMs(response);
    throw new CarrierError(
      kindForStatus(response.status),
      `${this.options.carrier} answered ${response.status}`,
      {
        carrier: this.options.carrier,
        status: response.status,
        ...(retry === undefined ? {} : { retryAfterMs: retry }),
      },
    );
  }
}
