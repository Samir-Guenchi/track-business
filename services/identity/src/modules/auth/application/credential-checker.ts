import { Inject, Injectable } from '@nestjs/common';
import { InvalidCredentialsError } from '../domain/auth.errors.js';
import { AFTER_SUCCESSFUL_LOGIN, afterFailedLogin, isLocked } from '../domain/login-lockout.js';
import type { User } from '../domain/user.js';
import {
  AUTH_PORTS,
  type Clock,
  type PasswordHasher,
  type UserRepository,
} from './ports/auth.ports.js';

/** Burns the same argon2 time for unknown emails so response time does not reveal accounts. */
const TIMING_DECOY_PASSWORD = 'timing-decoy-password';

/** Checks an email + password pair, applying the lockout rules. Returns the user or throws. */
@Injectable()
export class CredentialChecker {
  private decoyHash: Promise<string> | undefined;

  constructor(
    @Inject(AUTH_PORTS.users) private readonly users: UserRepository,
    @Inject(AUTH_PORTS.hasher) private readonly hasher: PasswordHasher,
    @Inject(AUTH_PORTS.clock) private readonly now: Clock,
  ) {}

  async check(email: string, password: string): Promise<User> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      await this.hasher.verify(await this.decoy(), password);
      throw new InvalidCredentialsError();
    }
    await this.checkPassword(user, password);
    return user;
  }

  private async checkPassword(user: User, password: string): Promise<void> {
    const now = this.now();
    const isValid = await this.hasher.verify(user.passwordHash, password);
    if (isLocked(user, now)) throw new InvalidCredentialsError();
    if (!isValid) {
      await this.users.saveLockout(user.id, afterFailedLogin(user, now));
      throw new InvalidCredentialsError();
    }
    if (user.failedLoginCount > 0) await this.users.saveLockout(user.id, AFTER_SUCCESSFUL_LOGIN);
  }

  private decoy(): Promise<string> {
    this.decoyHash ??= this.hasher.hash(TIMING_DECOY_PASSWORD);
    return this.decoyHash;
  }
}
