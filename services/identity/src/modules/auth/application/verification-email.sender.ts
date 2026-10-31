import { Inject, Injectable } from '@nestjs/common';
import type { User } from '../domain/user.js';
import { AUTH_PORTS, type AuthMailer, type OneTimeTokenStore } from './ports/auth.ports.js';

@Injectable()
export class VerificationEmailSender {
  constructor(
    @Inject(AUTH_PORTS.oneTimeTokens) private readonly tokens: OneTimeTokenStore,
    @Inject(AUTH_PORTS.mailer) private readonly mailer: AuthMailer,
  ) {}

  async send(user: Pick<User, 'id' | 'email' | 'locale'>): Promise<void> {
    const token = await this.tokens.create(user.id, 'email_verification');
    await this.mailer.send({ kind: 'verify_email', to: user.email, locale: user.locale, token });
  }
}
