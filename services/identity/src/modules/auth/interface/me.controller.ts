import { Controller, Get } from '@nestjs/common';
import type { MeResponse } from '@trackecom/contracts';
import { GetMeUseCase } from '../application/email-and-password.use-cases.js';
import { AccessTokenKeys } from '../infrastructure/access-token.keys.js';
import { Authenticated, Public } from '@trackecom/service-kit';
import { CurrentUserId } from '../../../authorization/request-context.js';

@Controller()
export class MeController {
  constructor(
    private readonly getMe: GetMeUseCase,
    private readonly keys: AccessTokenKeys,
  ) {}

  @Get('auth/me')
  @Authenticated()
  me(@CurrentUserId() userId: string): Promise<MeResponse> {
    return this.getMe.execute(userId);
  }

  /** Public keys for verifying access tokens; services cache this (ADR-0001). */
  @Public()
  @Get('.well-known/jwks.json')
  jwks(): ReturnType<AccessTokenKeys['jwks']> {
    return this.keys.jwks();
  }
}
