import { Injectable } from '@nestjs/common';
import type { LoginRequest } from '@trackecom/contracts';
import { CredentialChecker } from './credential-checker.js';
import { type Session, SessionFactory } from './session-factory.js';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly credentials: CredentialChecker,
    private readonly sessions: SessionFactory,
  ) {}

  async execute(request: LoginRequest): Promise<Session> {
    const user = await this.credentials.check(request.email, request.password);
    return this.sessions.start(user.id);
  }
}
