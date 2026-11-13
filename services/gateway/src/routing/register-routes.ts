import proxy from '@fastify/http-proxy';
import type { IncomingHttpHeaders } from 'node:http';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { ROUTES } from './route-table.js';
import { sendUpstreamError } from './upstream-error.js';
import type { Upstreams } from './upstreams.js';

const UPSTREAM_TIMEOUT_MS = 30_000;

/** Lets services see the real client (rate limits, audit IP) and the scheme (secure cookies). */
function forwardedHeaders(
  request: Pick<FastifyRequest, 'ip' | 'protocol' | 'hostname' | 'id'>,
  headers: IncomingHttpHeaders,
): IncomingHttpHeaders {
  return {
    ...headers,
    'x-forwarded-for': request.ip,
    'x-forwarded-proto': request.protocol,
    'x-forwarded-host': request.hostname,
    'x-correlation-id': request.id,
  };
}

/**
 * Forwards each public prefix to the service that owns it, streaming bodies untouched
 * (webhook signatures stay valid). Unknown paths, including `/internal/*`, get the gateway's 404.
 */
export async function registerRoutes(
  fastify: FastifyInstance,
  upstreams: Upstreams,
): Promise<void> {
  for (const route of ROUTES) {
    await fastify.register(proxy, {
      upstream: upstreams[route.service],
      prefix: route.prefix,
      rewritePrefix: route.prefix,
      http: { requestOptions: { timeout: UPSTREAM_TIMEOUT_MS } },
      replyOptions: { rewriteRequestHeaders: forwardedHeaders, onError: sendUpstreamError },
    });
  }
}
