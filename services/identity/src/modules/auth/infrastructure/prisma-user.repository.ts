import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { NewUser, UserRepository } from '../application/ports/auth.ports.js';
import { EmailAlreadyRegisteredError } from '../domain/auth.errors.js';
import type { LockoutState } from '../domain/login-lockout.js';
import type { User } from '../domain/user.js';

const UNIQUE_VIOLATION = 'P2002';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(user: NewUser): Promise<User> {
    try {
      return await this.prisma.user.create({ data: { id: randomUUID(), ...user } });
    } catch (error) {
      const isDuplicate =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_VIOLATION;
      throw isDuplicate ? new EmailAlreadyRegisteredError() : error;
    }
  }

  async saveLockout(userId: string, state: LockoutState): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { ...state } });
  }

  async markEmailVerified(userId: string, at: Date): Promise<void> {
    await this.prisma.user.updateMany({
      where: { id: userId, emailVerifiedAt: null },
      data: { emailVerifiedAt: at },
    });
  }

  async changePassword(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash, failedLoginCount: 0, lockedUntil: null },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }
}
