import { Body, Controller, Get, Header, HttpCode, Ip, Param, Post } from '@nestjs/common';
import {
  type SelfConfirmRequest,
  SelfConfirmRequestSchema,
  type SelfConfirmResponse,
  type SelfConfirmView,
} from '@trackecom/contracts';
import { Public, ZodValidationPipe } from '@trackecom/service-kit';
import { z } from 'zod';
import { SelfConfirmUseCases } from '../application/self-confirm.use-cases.js';

/** Malformed tokens are refused before any lookup. */
export const TokenPipe = new ZodValidationPipe(z.string().regex(/^[A-Za-z0-9_-]{32}$/));

/**
 * The customer's page (#54), reached from the link in an SMS or WhatsApp message. No login:
 * the unguessable, single-use, expiring token is the key. The gateway rate-limits /public.
 */
@Public()
@Controller('public/confirm')
export class SelfConfirmController {
  constructor(private readonly selfConfirm: SelfConfirmUseCases) {}

  @Get(':token')
  @Header('cache-control', 'no-store')
  view(@Param('token', TokenPipe) token: string): Promise<SelfConfirmView> {
    return this.selfConfirm.view(token);
  }

  @Post(':token')
  @HttpCode(200)
  async answer(
    @Param('token', TokenPipe) token: string,
    @Body(new ZodValidationPipe(SelfConfirmRequestSchema)) body: SelfConfirmRequest,
    @Ip() ip: string,
  ): Promise<SelfConfirmResponse> {
    const order = await this.selfConfirm.answer(token, body, ip);
    return { status: order.status };
  }
}
