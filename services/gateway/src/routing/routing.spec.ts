import 'reflect-metadata';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import Fastify, { type FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createGatewayApp } from '../create-gateway-app.js';
import { testEnv } from '../test/test-env.js';
import { UPSTREAM_SERVICES, type UpstreamService } from './route-table.js';

/** A fake service that echoes who it is and what it received. */
async function startEcho(
  service: UpstreamService,
): Promise<{ server: FastifyInstance; url: string }> {
  const server = Fastify();
  server.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) =>
    done(null, body),
  );
  server.all('/*', async (request) => ({
    service,
    url: request.url,
    body: request.body ?? null,
    forwardedProto: request.headers['x-forwarded-proto'],
    cookie: request.headers.cookie ?? null,
  }));
  const url = await server.listen({ port: 0, host: '127.0.0.1' });
  return { server, url };
}

describe('gateway routing', () => {
  const upstreams: FastifyInstance[] = [];
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const overrides: Record<string, string> = {};
    for (const service of UPSTREAM_SERVICES) {
      const echo = await startEcho(service);
      upstreams.push(echo.server);
      overrides[`${service.toUpperCase()}_URL`] = echo.url;
    }
    app = await createGatewayApp(testEnv(overrides));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
    await Promise.all(upstreams.map((server) => server.close()));
  });

  const send = (url: string) => app.inject({ method: 'GET', url });

  it.each([
    ['/auth/me', 'identity'],
    ['/stores/current/members', 'identity'],
    ['/invitations/accept', 'identity'],
    ['/geo/wilayas', 'shipping'],
    ['/public/tracking/ABC123', 'shipping'],
    ['/webhooks/yalidine/store_1', 'shipping'],
    ['/orders?page=2', 'orders'],
    ['/public/confirm/token', 'orders'],
    ['/money/summary', 'payments'],
    ['/webhooks/messages/whatsapp', 'notifications'],
    ['/webhooks/shops/shopify', 'integrations'],
  ])('%s goes to %s with its path and query unchanged', async (url, service) => {
    const response = await send(url);
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ service, url });
  });

  it('never exposes service-to-service routes', async () => {
    expect((await send('/internal/stores/s1/orders')).statusCode).toBe(404);
  });

  it('forwards the body, cookies and the original scheme', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      headers: {
        cookie: 'te_access=abc',
        'content-type': 'application/json',
        'x-forwarded-proto': 'https',
      },
      payload: '{"email":"a@b.dz"}',
    });
    expect(response.json()).toMatchObject({
      body: '{"email":"a@b.dz"}',
      cookie: 'te_access=abc',
      forwardedProto: 'https',
    });
  });

  it('keeps answering its own health routes', async () => {
    expect((await send('/health/live')).json()).toMatchObject({ service: 'gateway' });
  });
});
