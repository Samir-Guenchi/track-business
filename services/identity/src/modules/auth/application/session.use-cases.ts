import { Inject, Injectable } from '@nestjs/common';
import { InvalidTokenError } from '../domain/auth.errors.js';
import { AUTH_PORTS, type RefreshTokenStore } from './ports/auth.ports.js';
import { type Session, SessionFactory } from './session-factory.js';

@Injectable()
export class RefreshSessionUseCase {
  constructor(
    @Inject(AUTH_PORTS.refreshTokens) private readonly refreshTokens: RefreshTokenStore,
    private readonly sessions: SessionFactory,
  ) {}

  async execute(refreshToken: string | undefined): Promise<Session> {
    if (!refreshToken) throw new InvalidTokenError();
    const rotated = await this.refreshTokens.rotate(refreshToken);
    return this.sessions.withAccessToken(rotated.userId, rotated.token);
  }
}

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(AUTH_PORTS.refreshTokens) private readonly refreshTokens: RefreshTokenStore,
  ) {}

  /** Idempotent: logging out twice, or with an unknown token, succeeds. */
  async execute(refreshToken: string | undefined): Promise<void> {
    if (refreshToken) await this.refreshTokens.revoke(refreshToken);
  }
}
