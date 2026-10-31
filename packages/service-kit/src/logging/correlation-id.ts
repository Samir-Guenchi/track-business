import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

export const CORRELATION_HEADER = 'x-correlation-id';
const SAFE_ID = /^[\w.-]{8,128}$/;

/** Reuses the caller's correlation id when it looks sane, otherwise starts a new one. */
export function correlationIdOf(request: IncomingMessage): string {
  const incoming = request.headers[CORRELATION_HEADER];
  return typeof incoming === 'string' && SAFE_ID.test(incoming) ? incoming : randomUUID();
}
