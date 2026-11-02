import { ApiErrorSchema, STORE_HEADER } from '@trackecom/contracts';
import type { z } from 'zod';
import { getActiveStoreId } from '../session/active-store';
import { apiBaseUrl } from './api-base-url';
import { ApiClientError } from './api-client-error';
import { canRefreshAfter, refreshSession } from './session-refresh';

export interface ApiRequest<TSchema extends z.ZodType> {
  readonly path: string;
  /** Contract schema from @trackecom/contracts; the response is parsed with it. */
  readonly schema: TSchema;
  readonly method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  readonly body?: unknown;
  readonly signal?: AbortSignal;
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text === '') return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function toError(response: Response): Promise<ApiClientError> {
  const parsed = ApiErrorSchema.safeParse(await readBody(response));
  if (parsed.success) return new ApiClientError(response.status, parsed.data.error);
  return new ApiClientError(response.status, {
    code: 'UNEXPECTED_RESPONSE',
    message: response.statusText,
  });
}

function headersFor(request: ApiRequest<z.ZodType>): Record<string, string> {
  const headers: Record<string, string> = {};
  const storeId = getActiveStoreId();
  if (storeId) headers[STORE_HEADER] = storeId;
  if (request.body !== undefined) headers['content-type'] = 'application/json';
  return headers;
}

function send(request: ApiRequest<z.ZodType>): Promise<Response> {
  const init: RequestInit = {
    method: request.method ?? 'GET',
    credentials: 'include',
    headers: headersFor(request),
  };
  if (request.signal) init.signal = request.signal;
  if (request.body !== undefined) init.body = JSON.stringify(request.body);
  return fetch(new URL(request.path, apiBaseUrl), init);
}

/**
 * Typed call to the gateway. Types come from the zod contract, never hand-written.
 * Session cookies travel with `credentials: 'include'`; an expired access token is refreshed once.
 */
export async function apiRequest<TSchema extends z.ZodType>(
  request: ApiRequest<TSchema>,
): Promise<z.infer<TSchema>> {
  let response = await send(request);
  if (response.status === 401 && canRefreshAfter(request.path) && (await refreshSession())) {
    response = await send(request);
  }
  if (!response.ok) throw await toError(response);
  return request.schema.parse(await readBody(response));
}
