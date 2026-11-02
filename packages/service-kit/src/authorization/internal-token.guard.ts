import { createHash, timingSafeEqual } from 'node:crypto';
import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { InvalidTokenError } from '../store-access/access.errors.js';

/** Header a service sends on service-to-service calls (ADR-0004). */
export const INTERNAL_TOKEN_HEADER = 'x-internal-token';
/** Injection token for the shared secret; undefined turns every internal route off. */
export const INTERNAL_TOKEN = Symbol('INTERNAL_TOKEN');

const digest = (value: string) => createHash('sha256').update(value).digest();

/** Constant-time comparison; false when no secret is configured. */
export function internalTokenMatches(expected: string | undefined, presented: unknown): boolean {
  if (!expected || typeof presented !== 'string') return false;
  return timingSafeEqual(digest(expected), digest(presented));
}

/**
 * For routes only other services call, next to `@Public()` (no user token). The caller proves it
 * is one of ours with the shared secret; the gateway never forwards `/internal` routes.
 */
@Injectable()
export class InternalTokenGuard implements CanActivate {
  constructor(@Inject(INTERNAL_TOKEN) private readonly token: string | undefined) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, unknown> }>();
    if (!internalTokenMatches(this.token, request.headers[INTERNAL_TOKEN_HEADER])) {
      throw new InvalidTokenError();
    }
    return true;
  }
}
