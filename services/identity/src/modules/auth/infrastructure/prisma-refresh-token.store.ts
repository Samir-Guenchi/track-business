import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { AUTH_PORTS, type Clock, type RefreshTokenStore } from '../application/ports/auth.ports.js';
import { InvalidTokenError } from '../domain/auth.errors.js';
import { hashToken, newRawToken } from './random-token.js';

export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class PrismaRefreshTokenStore implements RefreshTokenStore {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUTH_PORTS.clock) private readonly now: Clock,
  ) {}

  start(userId: string): Promise<string> {
    return this.issue(userId, randomUUID());
  }

  async rotate(rawToken: string): Promise<{ userId: string; token: string }> {
    const now = this.now();
    const current = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
    });
    if (!current || current.revokedAt || current.expiresAt <= now) throw new InvalidTokenError();
    // Atomic claim: only one concurrent request can rotate a given token.
    const claimed = await this.prisma.refreshToken.updateMany({
      where: { id: current.id, rotatedAt: null },
      data: { rotatedAt: now },
    });
    if (claimed.count === 0) {
      await this.revokeFamily(current.familyId);
      throw new InvalidTokenError();
    }
    return { userId: current.userId, token: await this.issue(current.userId, current.familyId) };
  }

  async revoke(rawToken: string): Promise<void> {
    const token = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
    });
    if (token) await this.revokeFamily(token.familyId);
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: this.now() },
    });
  }

  private async issue(userId: string, familyId: string): Promise<string> {
    const raw = newRawToken();
    const expiresAt = new Date(this.now().getTime() + REFRESH_TOKEN_TTL_MS);
    await this.prisma.refreshToken.create({
      data: { id: randomUUID(), userId, familyId, tokenHash: hashToken(raw), expiresAt },
    });
    return raw;
  }
}
