import { Inject, Injectable } from '@nestjs/common';
import type { RegisterRequest } from '@trackecom/contracts';
import { assertStrongPassword } from '../domain/password-policy.js';
import type { User } from '../domain/user.js';
import { AUTH_PORTS, type PasswordHasher, type UserRepository } from './ports/auth.ports.js';

/** Creates a user with a policy-checked, argon2-hashed password. */
@Injectable()
export class AccountCreator {
  constructor(
    @Inject(AUTH_PORTS.users) private readonly users: UserRepository,
    @Inject(AUTH_PORTS.hasher) private readonly hasher: PasswordHasher,
  ) {}

  async create(request: RegisterRequest): Promise<User> {
    assertStrongPassword(request.password, request);
    return this.users.create({
      email: request.email,
      passwordHash: await this.hasher.hash(request.password),
      name: request.name,
      phone: request.phone ?? null,
      locale: request.locale,
    });
  }
}
