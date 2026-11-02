import { Body, Controller, Get, Header, HttpCode, Param, Post } from '@nestjs/common';
import {
  type CreateDeliveryRequest,
  CreateDeliveryRequestSchema,
  type DeliveryChoices,
  PublicCodeSchema,
} from '@trackecom/contracts';
import { Public, ZodValidationPipe } from '@trackecom/service-kit';
import { PublicDeliveryChoicesService } from '../application/public-delivery-choices.service.js';

const code = new ZodValidationPipe(PublicCodeSchema);

/**
 * The customer's choices on the tracking page (#136). Same key as the page: the random public
 * code. Each parcel takes a few requests a day, and the gateway rate-limits the route per IP.
 */
@Controller('public/tracking')
export class PublicDeliveryChoicesController {
  constructor(private readonly choices: PublicDeliveryChoicesService) {}

  @Get(':publicCode/choices')
  @Public()
  @Header('cache-control', 'no-store')
  get(@Param('publicCode', code) publicCode: string): Promise<DeliveryChoices> {
    return this.choices.choices(publicCode);
  }

  @Post(':publicCode/requests')
  @Public()
  @HttpCode(201)
  @Header('cache-control', 'no-store')
  create(
    @Param('publicCode', code) publicCode: string,
    @Body(new ZodValidationPipe(CreateDeliveryRequestSchema)) body: CreateDeliveryRequest,
  ): Promise<DeliveryChoices> {
    return this.choices.request(publicCode, body);
  }
}
