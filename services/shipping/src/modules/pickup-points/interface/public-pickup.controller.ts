import { Controller, Get, Header, Param } from '@nestjs/common';
import { PublicCodeSchema, type PublicPickup } from '@trackecom/contracts';
import { Public, ZodValidationPipe } from '@trackecom/service-kit';
import { PublicPickupService } from '../application/public-pickup.service.js';

/** The pickup point and code on the tracking page (#202): only the link holder sees the code. */
@Controller('public/tracking')
export class PublicPickupController {
  constructor(private readonly pickups: PublicPickupService) {}

  @Get(':publicCode/pickup')
  @Public()
  @Header('cache-control', 'no-store')
  pickup(
    @Param('publicCode', new ZodValidationPipe(PublicCodeSchema)) publicCode: string,
  ): Promise<PublicPickup> {
    return this.pickups.pickup(publicCode);
  }
}
