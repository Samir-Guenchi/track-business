import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import { RouteConfig } from '@nestjs/platform-fastify';
import {
  type LoginRequest,
  LoginRequestSchema,
  type RegisterRequest,
  RegisterRequestSchema,
  type SessionResponse,
} from '@trackecom/contracts';
import { ZodValidationPipe } from '@trackecom/service-kit';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { LoginUseCase } from '../application/login.use-case.js';
import { RegisterUseCase } from '../application/register.use-case.js';
import { sendSession } from './session-cookies.js';

/** Brute-force protection on top of the account lockout: per IP, per route. */
export const STRICT_RATE_LIMIT = { rateLimit: { max: 10, timeWindow: '1 minute' } };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUseCase,
    private readonly login: LoginUseCase,
  ) {}

  @Post('register')
  @RouteConfig(STRICT_RATE_LIMIT)
  async register(
    @Body(new ZodValidationPipe(RegisterRequestSchema)) body: RegisterRequest,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<SessionResponse> {
    return sendSession(request, reply, await this.registerUser.execute(body));
  }

  @Post('login')
  @HttpCode(200)
  @RouteConfig(STRICT_RATE_LIMIT)
  async signIn(
    @Body(new ZodValidationPipe(LoginRequestSchema)) body: LoginRequest,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<SessionResponse> {
    return sendSession(request, reply, await this.login.execute(body));
  }
}
