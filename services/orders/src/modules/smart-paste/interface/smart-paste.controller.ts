import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  type ParseOrderTextRequest,
  ParseOrderTextRequestSchema,
  type ParseOrderTextResponse,
} from '@trackecom/contracts';
import { RequirePermission, ZodValidationPipe } from '@trackecom/service-kit';
import { ParseOrderTextUseCase } from '../application/parse-order-text.use-case.js';

@Controller('orders')
export class SmartPasteController {
  constructor(private readonly parse: ParseOrderTextUseCase) {}

  /** POST so the customer's message stays out of URLs and access logs. */
  @Post('parse-text')
  @HttpCode(200)
  @RequirePermission('orders.write')
  async parseText(
    @Body(new ZodValidationPipe(ParseOrderTextRequestSchema)) body: ParseOrderTextRequest,
  ): Promise<ParseOrderTextResponse> {
    return this.parse.execute(body.text);
  }
}
