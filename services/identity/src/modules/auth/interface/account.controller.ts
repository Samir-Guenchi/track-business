import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { RouteConfig } from '@nestjs/platform-fastify';
import {
  type ForgotPasswordRequest,
  ForgotPasswordRequestSchema,
  type ResetPasswordRequest,
  ResetPasswordRequestSchema,
  type VerifyEmailRequest,
  VerifyEmailRequestSchema,
} from '@trackecom/contracts';
import { ZodValidationPipe } from '@trackecom/service-kit';
import {
  RequestPasswordResetUseCase,
  ResetPasswordUseCase,
  VerifyEmailUseCase,
} from '../application/email-and-password.use-cases.js';
import { STRICT_RATE_LIMIT } from './auth.controller.js';

@Controller()
export class AccountController {
  constructor(
    private readonly verifyEmail: VerifyEmailUseCase,
    private readonly requestReset: RequestPasswordResetUseCase,
    private readonly resetPassword: ResetPasswordUseCase,
  ) {}

  @Post('auth/verify-email')
  @HttpCode(204)
  async verify(
    @Body(new ZodValidationPipe(VerifyEmailRequestSchema)) body: VerifyEmailRequest,
  ): Promise<void> {
    await this.verifyEmail.execute(body.token);
  }

  @Post('auth/forgot-password')
  @HttpCode(202)
  @RouteConfig(STRICT_RATE_LIMIT)
  async forgot(
    @Body(new ZodValidationPipe(ForgotPasswordRequestSchema)) body: ForgotPasswordRequest,
  ): Promise<void> {
    await this.requestReset.execute(body.email);
  }

  @Post('auth/reset-password')
  @HttpCode(204)
  @RouteConfig(STRICT_RATE_LIMIT)
  async reset(
    @Body(new ZodValidationPipe(ResetPasswordRequestSchema)) body: ResetPasswordRequest,
  ): Promise<void> {
    await this.resetPassword.execute(body);
  }
}
