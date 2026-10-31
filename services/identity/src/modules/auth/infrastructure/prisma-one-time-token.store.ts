import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import {
  AUTH_PORTS,
  type Clock,
  type OneTimePurpose,
  type OneTimeTokenStore,
} from '../application/ports/auth.ports.js';
import { hashToken, newRawToken } from './random-token.js';

const TTL_MS: Record<OneTimePurpose, number> = {
  email_verification: 48 * 60 * 60 * 1000,
  password_reset: 30 * 60 * 1000,
};

@Injectable()
export class PrismaOneTimeTokenStore implements OneTimeTokenStore {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUTH_PORTS.clock) private readonly now: Clock,
  ) {}

  /** A new link invalidates the previous unused links of the same purpose. */
  async create(userId: string, purpose: OneTimePurpose): Promise<string> {
    const raw = newRawToken();
    const now = this.now();
    await this.prisma.$transaction([
      this.prisma.userToken.updateMany({
        where: { userId, purpose, usedAt: null },
        data: { usedAt: now },
      }),
      this.prisma.userToken.create({
        data: {
          id: randomUUID(),
          userId,
          purpose,
          tokenHash: hashToken(raw),
          expiresAt: new Date(now.getTime() + TTL_MS[purpose]),
        },
      }),
    ]);
    return raw;
  }

  async peek(rawToken: string, purpose: OneTimePurpose): Promise<string | null> {
    const token = await this.prisma.userToken.findFirst({ where: this.usable(rawToken, purpose) });
    return token?.userId ?? null;
  }

  async consume(rawToken: string, purpose: OneTimePurpose): Promise<string | null> {
    const userId = await this.peek(rawToken, purpose);
    if (!userId) return null;
    const used = await this.prisma.userToken.updateMany({
      where: this.usable(rawToken, purpose),
      data: { usedAt: this.now() },
    });
    return used.count === 1 ? userId : null;
  }

  private usable(rawToken: string, purpose: OneTimePurpose) {
    return { tokenHash: hashToken(rawToken), purpose, usedAt: null, expiresAt: { gt: this.now() } };
  }
}
