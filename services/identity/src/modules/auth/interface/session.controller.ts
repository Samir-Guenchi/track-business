import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import {
  type RefreshRequest,
  RefreshRequestSchema,
  type SessionResponse,
} from '@trackecom/contracts';
import { ZodValidationPipe } from '@trackecom/service-kit';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { LogoutUseCase, RefreshSessionUseCase } from '../application/session.use-cases.js';
import { clearSession, readRefreshToken, sendSession } from './session-cookies.js';

@Controller('auth')
export class SessionController {
  constructor(
    private readonly refresh: RefreshSessionUseCase,
    private readonly logout: LogoutUseCase,
  ) {}

  @Post('refresh')
  @HttpCode(200)
  async rotate(
    @Body(new ZodValidationPipe(RefreshRequestSchema)) body: RefreshRequest = {},
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<SessionResponse> {
    return sendSession(
      request,
      reply,
      await this.refresh.execute(readRefreshToken(request, body.refreshToken)),
    );
  }

  @Post('logout')
  @HttpCode(204)
  async signOut(
    @Body(new ZodValidationPipe(RefreshRequestSchema)) body: RefreshRequest = {},
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    await this.logout.execute(readRefreshToken(request, body.refreshToken));
    clearSession(reply);
  }
}
