import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { apiRequest } from './api-client';
import { ApiClientError } from './api-client-error';

const PingSchema = z.object({ ok: z.boolean() });

function mockFetch(status: number, body: unknown): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(body), { status })),
  );
}

describe('apiRequest', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('parses the response with the contract schema', async () => {
    mockFetch(200, { ok: true });
    await expect(apiRequest({ path: '/ping', schema: PingSchema })).resolves.toEqual({ ok: true });
  });

  it('rejects a response that breaks the contract', async () => {
    mockFetch(200, { ok: 'yes' });
    await expect(apiRequest({ path: '/ping', schema: PingSchema })).rejects.toThrow();
  });

  it('turns the shared error shape into ApiClientError', async () => {
    mockFetch(409, { error: { code: 'ORDER_ALREADY_SHIPPED', message: 'Already shipped' } });
    const failure = await apiRequest({ path: '/ping', schema: PingSchema }).catch(
      (e: unknown) => e,
    );
    expect(failure).toBeInstanceOf(ApiClientError);
    expect((failure as ApiClientError).code).toBe('ORDER_ALREADY_SHIPPED');
    expect((failure as ApiClientError).status).toBe(409);
  });

  it('falls back to a generic code when the body is not the shared shape', async () => {
    mockFetch(502, 'bad gateway');
    const failure = await apiRequest({ path: '/ping', schema: PingSchema }).catch(
      (e: unknown) => e,
    );
    expect((failure as ApiClientError).code).toBe('UNEXPECTED_RESPONSE');
  });
});
