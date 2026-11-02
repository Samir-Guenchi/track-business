import { Controller, Get, Header, Param } from '@nestjs/common';
import { FormKeySchema, type PublicOrderForm } from '@trackecom/contracts';
import { Public, ZodValidationPipe } from '@trackecom/service-kit';
import { PublicFormsService } from '../application/public-forms.service.js';

export const FormKeyPipe = new ZodValidationPipe(FormKeySchema);

/**
 * The customer's order form (#134), opened from any landing page. No login: the public key is
 * the only input, and the answer carries no store id. The gateway rate-limits /public.
 */
@Public()
@Controller('public/forms')
export class PublicFormsController {
  constructor(private readonly forms: PublicFormsService) {}

  @Get(':key')
  @Header('cache-control', 'public, max-age=60')
  view(@Param('key', FormKeyPipe) key: string): Promise<PublicOrderForm> {
    return this.forms.view(key);
  }
}
