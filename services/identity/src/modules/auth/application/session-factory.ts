import { Inject, Injectable } from '@nestjs/common';
import { type AccessTokenIssuer, AUTH_PORTS, type RefreshTokenStore } from './ports/auth.ports.js';

export interface Session {
  readonly accessToken: string;
  readonly accessTokenExpiresAt: Date;
  readonly refreshToken: string;
}

/** A session = short-lived access JWT + a refresh token from a rotating family. */
@Injectable()
export class SessionFactory {
  constructor(
    @Inject(AUTH_PORTS.accessTokens) private readonly accessTokens: AccessTokenIssuer,
    @Inject(AUTH_PORTS.refreshTokens) private readonly refreshTokens: RefreshTokenStore,
  ) {}

  async start(userId: string): Promise<Session> {
    return this.withAccessToken(userId, await this.refreshTokens.start(userId));
  }

  async withAccessToken(userId: string, refreshToken: string): Promise<Session> {
    const access = await this.accessTokens.issue(userId);
    return { accessToken: access.token, accessTokenExpiresAt: access.expiresAt, refreshToken };
  }
}
