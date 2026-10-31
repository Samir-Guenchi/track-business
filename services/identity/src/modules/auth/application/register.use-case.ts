import { Injectable } from '@nestjs/common';
import type { RegisterRequest } from '@trackecom/contracts';
import { AccountCreator } from './account-creator.js';
import { type Session, SessionFactory } from './session-factory.js';
import { VerificationEmailSender } from './verification-email.sender.js';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly accounts: AccountCreator,
    private readonly verification: VerificationEmailSender,
    private readonly sessions: SessionFactory,
  ) {}

  async execute(request: RegisterRequest): Promise<Session> {
    const user = await this.accounts.create(request);
    await this.verification.send(user);
    return this.sessions.start(user.id);
  }
}
