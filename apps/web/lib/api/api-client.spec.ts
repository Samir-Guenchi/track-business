import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { setActiveStoreId } from '../session/active-store';
import { apiRequest } from './api-client';
import { ApiClientError } from './api-client-error';

const PingSchema = z.object({ ok: z.boolean() });

function respond(...replies: Array<[number, unknown]>) {
  const fetchMock = vi.fn();
  for (const [status, body] of replies) {
    const text = body === undefined ? null : JSON.stringify(body);
    fetchMock.mockResolvedValueOnce(new Response(text, { status }));
  }
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const ping = () => apiRequest({ path: '/ping', schema: PingSchema });
const failureOf = (promise: Promise<unknown>) => promise.catch((error: unknown) => error);

describe('apiRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setActiveStoreId(null);
  });

  it('parses the response with the contract schema', async () => {
    respond([200, { ok: true }]);
    await expect(ping()).resolves.toEqual({ ok: true });
  });

  it('rejects a response that breaks the contract', async () => {
    respond([200, { ok: 'yes' }]);
    await expect(ping()).rejects.toThrow();
  });

  it('turns the shared error shape into ApiClientError', async () => {
    respond([409, { error: { code: 'ORDER_ALREADY_SHIPPED', message: 'Already shipped' } }]);
    const failure = await failureOf(ping());
    expect(failure).toBeInstanceOf(ApiClientError);
    expect(failure).toMatchObject({ code: 'ORDER_ALREADY_SHIPPED', status: 409 });
  });

  it('falls back to a generic code when the body is not the shared shape', async () => {
    respond([502, 'bad gateway']);
    expect(await failureOf(ping())).toMatchObject({ code: 'UNEXPECTED_RESPONSE' });
  });

  it('accepts an empty body (202, 204)', async () => {
    respond([204, undefined]);
    await expect(apiRequest({ path: '/x', schema: z.unknown() })).resolves.toBeUndefined();
  });

  it('refreshes the session once after a 401 and retries', async () => {
    const fetchMock = respond([401, undefined], [200, {}], [200, { ok: true }]);
    await expect(ping()).resolves.toEqual({ ok: true });
    expect(String(fetchMock.mock.calls[1]?.[0])).toMatch(/\/auth\/refresh$/u);
  });

  it('does not refresh after a failed login', async () => {
    const fetchMock = respond([401, { error: { code: 'auth.invalid_credentials', message: 'x' } }]);
    const login = apiRequest({ path: '/auth/login', schema: PingSchema, method: 'POST', body: {} });
    expect(await failureOf(login)).toMatchObject({ code: 'auth.invalid_credentials' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('sends the active store header', async () => {
    const fetchMock = respond([200, { ok: true }]);
    setActiveStoreId('store_1');
    await ping();
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toMatchObject({ 'x-store-id': 'store_1' });
  });
});
