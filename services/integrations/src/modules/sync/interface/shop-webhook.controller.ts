import { Controller, HttpCode, Param, Post, Req } from '@nestjs/common';
import { Public, ZodValidationPipe } from '@trackecom/service-kit';
import { z } from 'zod';
import { WebhookIntake } from '../application/webhook-intake.js';

/** The parts of the Fastify request we read; `rawBody` is kept by createServiceApp. */
interface RawRequest {
  readonly headers: Record<string, string | string[] | undefined>;
  readonly rawBody?: Buffer;
}

const headersOf = (request: RawRequest): Record<string, string | undefined> =>
  Object.fromEntries(
    Object.entries(request.headers).map(([name, value]) => [
      name,
      Array.isArray(value) ? value.join(',') : value,
    ]),
  );

/**
 * `POST /webhooks/shops/:connectionId`, the URL registered in the shop for order events. No
 * login: the connector checks the shop's signature over the exact bytes received.
 */
@Controller('webhooks/shops')
export class ShopWebhookController {
  constructor(private readonly intake: WebhookIntake) {}

  @Post(':connectionId')
  @Public()
  @HttpCode(200)
  async receive(
    @Param('connectionId', new ZodValidationPipe(z.uuid())) connectionId: string,
    @Req() request: RawRequest,
  ): Promise<{ received: number }> {
    const rawBody = request.rawBody?.toString('utf8') ?? '';
    const received = await this.intake.receive(connectionId, {
      headers: headersOf(request),
      rawBody,
    });
    return { received };
  }
}
