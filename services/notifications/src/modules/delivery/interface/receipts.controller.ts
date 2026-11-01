import { Body, Controller, HttpCode, Inject, Param, Post, Query } from '@nestjs/common';
import { InvalidTokenError, Public, internalTokenMatches } from '@trackecom/service-kit';
import { type Env, ENV } from '../../../config/env.schema.js';
import { ReceiptsService } from '../application/receipts.service.js';

/**
 * Delivery receipts from the SMS / WhatsApp provider. The provider cannot sign in, so the URL
 * we register with it carries a secret `?token=` (MESSAGE_WEBHOOK_TOKEN).
 */
@Public()
@Controller('webhooks/messages')
export class ReceiptsController {
  constructor(
    private readonly receipts: ReceiptsService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  @Post(':provider')
  @HttpCode(204)
  async receive(
    @Param('provider') provider: string,
    @Query('token') token: unknown,
    @Body() body: unknown,
  ): Promise<void> {
    if (!internalTokenMatches(this.env.MESSAGE_WEBHOOK_TOKEN, token)) throw new InvalidTokenError();
    await this.receipts.apply(provider, body);
  }
}
