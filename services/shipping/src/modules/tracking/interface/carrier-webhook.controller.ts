import { Controller, HttpCode, Param, Post, Req } from '@nestjs/common';
import { CarrierCodeSchema } from '@trackecom/contracts';
import { Public, ZodValidationPipe } from '@trackecom/service-kit';
import { z } from 'zod';
import { CarrierWebhookService } from '../application/carrier-webhook.service.js';

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
 * `POST /webhooks/:carrier/:storeId`, the URL a seller registers in the carrier's dashboard. No
 * login: the adapter checks the carrier's signature over the exact bytes received.
 */
@Controller('webhooks')
export class CarrierWebhookController {
  constructor(private readonly webhooks: CarrierWebhookService) {}

  @Post(':carrier/:storeId')
  @Public()
  @HttpCode(200)
  async receive(
    @Param('carrier', new ZodValidationPipe(CarrierCodeSchema)) carrier: string,
    @Param('storeId', new ZodValidationPipe(z.uuid())) storeId: string,
    @Req() request: RawRequest,
  ): Promise<{ updated: number }> {
    const rawBody = request.rawBody?.toString('utf8') ?? '';
    const updated = await this.webhooks.receive({
      storeId,
      carrier,
      request: { headers: headersOf(request), rawBody },
    });
    return { updated };
  }
}
