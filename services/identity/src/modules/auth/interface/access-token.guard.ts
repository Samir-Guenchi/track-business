import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  createParamDecorator,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { InvalidTokenError } from '../domain/auth.errors.js';
import { AccessTokenVerifier } from '../infrastructure/access-token.verifier.js';
import { ACCESS_COOKIE } from './session-cookies.js';

interface AuthenticatedRequest extends FastifyRequest {
  userId?: string;
}

function bearerToken(request: FastifyRequest): string | undefined {
  const header = request.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
}

/** Accepts `Authorization: Bearer` (mobile, services) or the httpOnly access cookie (web). */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly verifier: AccessTokenVerifier) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = bearerToken(request) ?? request.cookies[ACCESS_COOKIE];
    if (!token) throw new InvalidTokenError();
    request.userId = (await this.verifier.verify(token)).userId;
    return true;
  }
}

/** The verified user id, set by AccessTokenGuard. */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const userId = context.switchToHttp().getRequest<AuthenticatedRequest>().userId;
    if (!userId) throw new InvalidTokenError();
    return userId;
  },
);
