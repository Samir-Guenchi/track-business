import { ApiErrorSchema } from '@trackecom/contracts';
import type { z } from 'zod';
import { ApiClientError } from './api-client-error';

export interface ApiRequest<TSchema extends z.ZodType> {
  readonly path: string;
  /** Contract schema from @trackecom/contracts; the response is parsed with it. */
  readonly schema: TSchema;
  readonly method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  readonly body?: unknown;
  readonly signal?: AbortSignal;
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function toError(response: Response): Promise<ApiClientError> {
  const payload: unknown = await response.json().catch(() => null);
  const parsed = ApiErrorSchema.safeParse(payload);
  if (parsed.success) return new ApiClientError(response.status, parsed.data.error);
  return new ApiClientError(response.status, {
    code: 'UNEXPECTED_RESPONSE',
    message: response.statusText,
  });
}

function toInit(request: ApiRequest<z.ZodType>): RequestInit {
  const init: RequestInit = { method: request.method ?? 'GET', credentials: 'include' };
  if (request.signal) init.signal = request.signal;
  if (request.body !== undefined) {
    init.headers = { 'content-type': 'application/json' };
    init.body = JSON.stringify(request.body);
  }
  return init;
}

/**
 * Typed call to the gateway. Types come from the zod contract, never hand-written.
 * The session cookie travels with `credentials: 'include'`; storeId is never sent by the client.
 */
export async function apiRequest<TSchema extends z.ZodType>(
  request: ApiRequest<TSchema>,
): Promise<z.infer<TSchema>> {
  const response = await fetch(new URL(request.path, apiBaseUrl), toInit(request));
  if (!response.ok) throw await toError(response);
  if (response.status === 204) return request.schema.parse(undefined);
  return request.schema.parse(await response.json());
}
