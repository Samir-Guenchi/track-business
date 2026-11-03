import { Body, Controller, Get, Header, Param, Post } from '@nestjs/common';
import {
  PortalCodeSchema,
  type ResellerOrderCreated,
  ResellerOrderRequestSchema,
  type ResellerPortal,
} from '@trackecom/contracts';
import { Public, ZodValidationPipe } from '@trackecom/service-kit';
import type { z } from 'zod';
import { ResellerPortalService } from '../application/reseller-portal.service.js';

const code = new ZodValidationPipe(PortalCodeSchema);

/** The reseller's portal link (#198): only the link holder sees their own orders. */
@Controller('public/resellers')
export class ResellerPortalController {
  constructor(private readonly portals: ResellerPortalService) {}

  @Get(':code')
  @Public()
  @Header('cache-control', 'no-store')
  portal(@Param('code', code) portalCode: string): Promise<ResellerPortal> {
    return this.portals.portal(portalCode);
  }

  @Post(':code/orders')
  @Public()
  @Header('cache-control', 'no-store')
  order(
    @Param('code', code) portalCode: string,
    @Body(new ZodValidationPipe(ResellerOrderRequestSchema))
    body: z.output<typeof ResellerOrderRequestSchema>,
  ): Promise<ResellerOrderCreated> {
    return this.portals.order(portalCode, body);
  }
}
