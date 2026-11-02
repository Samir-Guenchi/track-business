import { Body, Controller, Get, Header, Ip, Param, Post } from '@nestjs/common';
import {
  FormKeySchema,
  type PublicOrderForm,
  type SubmitFormOrderRequest,
  SubmitFormOrderRequestSchema,
  type SubmitFormOrderResponse,
} from '@trackecom/contracts';
import { Public, ZodValidationPipe } from '@trackecom/service-kit';
import { PublicFormsService } from '../application/public-forms.service.js';
import { SubmitFormOrderUseCase } from '../application/submit-form-order.use-case.js';

export const FormKeyPipe = new ZodValidationPipe(FormKeySchema);

/**
 * The customer's order form (#134), opened from any landing page. No login: the public key is
 * the only input, and the answer carries no store id. The gateway rate-limits /public.
 */
@Public()
@Controller('public/forms')
export class PublicFormsController {
  constructor(
    private readonly forms: PublicFormsService,
    private readonly submit: SubmitFormOrderUseCase,
  ) {}

  @Get(':key')
  @Header('cache-control', 'public, max-age=60')
  view(@Param('key', FormKeyPipe) key: string): Promise<PublicOrderForm> {
    return this.forms.view(key);
  }

  /** The customer's order. 409 for a repeat, 429 past the limits, 400 for a bot or a bad pick. */
  @Post(':key/orders')
  @Header('cache-control', 'no-store')
  order(
    @Param('key', FormKeyPipe) key: string,
    @Body(new ZodValidationPipe(SubmitFormOrderRequestSchema)) body: SubmitFormOrderRequest,
    @Ip() ip: string,
  ): Promise<SubmitFormOrderResponse> {
    return this.submit.execute({ key, body, ip });
  }
}
