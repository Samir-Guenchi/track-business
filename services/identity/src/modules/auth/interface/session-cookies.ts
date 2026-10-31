import type { SessionResponse } from '@trackecom/contracts';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Session } from '../application/session-factory.js';
import { REFRESH_TOKEN_TTL_MS } from '../infrastructure/prisma-refresh-token.store.js';

export const ACCESS_COOKIE = 'te_access';
export const REFRESH_COOKIE = 'te_refresh';
/** The refresh cookie is only sent to the auth routes, never to the rest of the API. */
const REFRESH_PATH = '/auth';

const base = (secure: boolean) => ({ httpOnly: true, secure, sameSite: 'lax' as const });

export const isMobileClient = (request: FastifyRequest): boolean =>
  request.headers['x-client-type'] === 'mobile';

/** Web: httpOnly cookies. Mobile: the refresh token is also returned in the body. */
export function sendSession(
  request: FastifyRequest,
  reply: FastifyReply,
  session: Session,
): SessionResponse {
  const secure = request.protocol === 'https';
  void reply.setCookie(ACCESS_COOKIE, session.accessToken, {
    ...base(secure),
    path: '/',
    expires: session.accessTokenExpiresAt,
  });
  void reply.setCookie(REFRESH_COOKIE, session.refreshToken, {
    ...base(secure),
    path: REFRESH_PATH,
    maxAge: REFRESH_TOKEN_TTL_MS / 1000,
  });
  const body: SessionResponse = {
    accessToken: session.accessToken,
    accessTokenExpiresAt: session.accessTokenExpiresAt.toISOString(),
  };
  return isMobileClient(request) ? { ...body, refreshToken: session.refreshToken } : body;
}

export function clearSession(reply: FastifyReply): void {
  void reply.clearCookie(ACCESS_COOKIE, { path: '/' });
  void reply.clearCookie(REFRESH_COOKIE, { path: REFRESH_PATH });
}

export function readRefreshToken(
  request: FastifyRequest,
  fromBody: string | undefined,
): string | undefined {
  return fromBody ?? request.cookies[REFRESH_COOKIE];
}
