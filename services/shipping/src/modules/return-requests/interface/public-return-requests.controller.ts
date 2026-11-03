import { Body, Controller, Get, Header, Param, Post } from '@nestjs/common';
import {
  type CreateReturnRequest,
  CreateReturnRequestSchema,
  PublicCodeSchema,
  type PublicReturnStatus,
} from '@trackecom/contracts';
import { Public, ZodValidationPipe } from '@trackecom/service-kit';
import { PublicReturnRequestsService } from '../application/public-return-requests.service.js';

const code = new ZodValidationPipe(PublicCodeSchema);

/** "Return or exchange" on the tracking page (#201): only the tracking link holder can ask. */
@Controller('public/tracking')
export class PublicReturnRequestsController {
  constructor(private readonly requests: PublicReturnRequestsService) {}

  @Get(':publicCode/return-request')
  @Public()
  @Header('cache-control', 'no-store')
  status(@Param('publicCode', code) publicCode: string): Promise<PublicReturnStatus> {
    return this.requests.status(publicCode);
  }

  @Post(':publicCode/return-request')
  @Public()
  @Header('cache-control', 'no-store')
  create(
    @Param('publicCode', code) publicCode: string,
    @Body(new ZodValidationPipe(CreateReturnRequestSchema)) body: CreateReturnRequest,
  ): Promise<PublicReturnStatus> {
    return this.requests.create(publicCode, body);
  }
}
