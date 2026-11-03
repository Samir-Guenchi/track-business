import { Body, Controller, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import {
  type ExpectedFeesRequest,
  ExpectedFeesRequestSchema,
  type ExpectedFeesResponse,
} from '@trackecom/contracts';
import { InternalTokenGuard, Public, ZodValidationPipe } from '@trackecom/service-kit';
import { z } from 'zod';
import { CarrierFeesService } from '../application/carrier-fees.service.js';

/**
 * Service-to-service read (ADR-0004): payments checks a payout's fees against the carrier's
 * rate card (#196). POST because a statement carries up to 5,000 tracking numbers.
 */
@Public()
@UseGuards(InternalTokenGuard)
@Controller('internal/stores/:storeId/carrier-fees')
export class InternalCarrierFeesController {
  constructor(private readonly fees: CarrierFeesService) {}

  @Post()
  @HttpCode(200)
  expected(
    @Param('storeId', new ZodValidationPipe(z.uuid())) storeId: string,
    @Body(new ZodValidationPipe(ExpectedFeesRequestSchema)) body: ExpectedFeesRequest,
  ): Promise<ExpectedFeesResponse> {
    return this.fees.expected(storeId, body);
  }
}
