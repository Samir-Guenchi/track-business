import { Controller, Get, Header, Param } from '@nestjs/common';
import { PublicCodeSchema, type PublicTrackingResponse } from '@trackecom/contracts';
import { Public, ZodValidationPipe } from '@trackecom/service-kit';
import { TrackingQueryService } from '../application/tracking-query.service.js';
import { toPublicTracking } from './tracking.dto.js';

/**
 * The customer's tracking page (#34). No login: the random public code is the only key, and the
 * answer carries no name, phone or address. The gateway rate-limits this route per IP.
 */
@Controller('public/tracking')
export class PublicTrackingController {
  constructor(private readonly tracking: TrackingQueryService) {}

  @Get(':publicCode')
  @Public()
  @Header('cache-control', 'public, max-age=60')
  async byCode(
    @Param('publicCode', new ZodValidationPipe(PublicCodeSchema)) publicCode: string,
  ): Promise<PublicTrackingResponse> {
    return toPublicTracking(await this.tracking.byPublicCode(publicCode));
  }
}
