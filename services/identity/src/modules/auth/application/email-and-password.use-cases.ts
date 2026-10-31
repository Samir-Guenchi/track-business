import { Inject, Injectable } from '@nestjs/common';
import type { MeResponse, ResetPasswordRequest } from '@trackecom/contracts';
import { InvalidTokenError } from '../domain/auth.errors.js';
import { assertStrongPassword } from '../domain/password-policy.js';
import {
  AUTH_PORTS,
  type AuthMailer,
  type Clock,
  type OneTimeTokenStore,
  type PasswordHasher,
  type UserRepository,
} from './ports/auth.ports.js';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(AUTH_PORTS.users) private readonly users: UserRepository,
    @Inject(AUTH_PORTS.oneTimeTokens) private readonly tokens: OneTimeTokenStore,
    @Inject(AUTH_PORTS.clock) private readonly now: Clock,
  ) {}

  async execute(token: string): Promise<void> {
    const userId = await this.tokens.consume(token, 'email_verification');
    if (!userId) throw new InvalidTokenError();
    await this.users.markEmailVerified(userId, this.now());
  }
}

@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    @Inject(AUTH_PORTS.users) private readonly users: UserRepository,
    @Inject(AUTH_PORTS.oneTimeTokens) private readonly tokens: OneTimeTokenStore,
    @Inject(AUTH_PORTS.mailer) private readonly mailer: AuthMailer,
  ) {}

  /** Always succeeds, so the endpoint cannot be used to test which emails have an account. */
  async execute(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (!user) return;
    const token = await this.tokens.create(user.id, 'password_reset');
    await this.mailer.send({ kind: 'reset_password', to: user.email, locale: user.locale, token });
  }
}

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(AUTH_PORTS.users) private readonly users: UserRepository,
    @Inject(AUTH_PORTS.oneTimeTokens) private readonly tokens: OneTimeTokenStore,
    @Inject(AUTH_PORTS.hasher) private readonly hasher: PasswordHasher,
  ) {}

  async execute(request: ResetPasswordRequest): Promise<void> {
    const userId = await this.tokens.peek(request.token, 'password_reset');
    const user = userId ? await this.users.findById(userId) : null;
    if (!user) throw new InvalidTokenError();
    // Checked before the link is used up, so a weak password does not cost the seller a new email.
    assertStrongPassword(request.password, user);
    if ((await this.tokens.consume(request.token, 'password_reset')) !== user.id)
      throw new InvalidTokenError();
    await this.users.changePassword(user.id, await this.hasher.hash(request.password));
  }
}

@Injectable()
export class GetMeUseCase {
  constructor(@Inject(AUTH_PORTS.users) private readonly users: UserRepository) {}

  async execute(userId: string): Promise<MeResponse> {
    const user = await this.users.findById(userId);
    if (!user) throw new InvalidTokenError();
    const { id, email, name, phone, locale } = user;
    return { id, email, name, phone, locale, emailVerified: user.emailVerifiedAt !== null };
  }
}
