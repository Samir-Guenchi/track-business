import type { ApiError } from '@trackecom/contracts';

interface ErrorReply {
  code(statusCode: number): ErrorReply;
  send(payload: ApiError): unknown;
}

const TIMEOUT_CODES: ReadonlySet<string> = new Set([
  'FST_REPLY_FROM_GATEWAY_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_BODY_TIMEOUT',
  'ETIMEDOUT',
]);

/**
 * A service that is down or slow answers in the shared error shape, never with
 * proxy internals (host names, ports) that would leak the private network.
 */
export function sendUpstreamError(reply: ErrorReply, { error }: { error: Error }): void {
  const code = (error as Error & { code?: string }).code ?? '';
  const isTimeout = TIMEOUT_CODES.has(code);
  reply.code(isTimeout ? 504 : 502).send({
    error: {
      code: isTimeout ? 'gateway.upstream_timeout' : 'gateway.upstream_unavailable',
      message: 'The service is temporarily unavailable. Try again in a moment.',
    },
  });
}
