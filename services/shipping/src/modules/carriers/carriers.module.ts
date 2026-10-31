import { Module } from '@nestjs/common';
import { CarrierRegistry } from '@trackecom/carriers';
import { CARRIERS_CLOCK, CarrierAccountsService } from './application/carrier-accounts.service.js';
import { CARRIER_ACCOUNT_REPOSITORY } from './application/ports/carrier-account.repository.js';
import { carrierProviders } from './infrastructure/carriers.providers.js';
import { PrismaCarrierAccountRepository } from './infrastructure/prisma-carrier-account.repository.js';
import { CarriersController } from './interface/carriers.controller.js';

/** Carrier adapters and each store's encrypted carrier accounts (#30). */
@Module({
  controllers: [CarriersController],
  providers: [
    ...carrierProviders,
    CarrierAccountsService,
    { provide: CARRIER_ACCOUNT_REPOSITORY, useClass: PrismaCarrierAccountRepository },
    { provide: CARRIERS_CLOCK, useValue: () => new Date() },
  ],
  exports: [CarrierAccountsService, CarrierRegistry],
})
export class CarriersModule {}
