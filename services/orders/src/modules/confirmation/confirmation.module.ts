import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module.js';
import { ConfirmationQueue } from './application/confirmation-queue.js';
import { ConfirmationSettingsService } from './application/confirmation-settings.service.js';
import { LogCallUseCase } from './application/log-call.use-case.js';
import { CONFIRMATION_REPOSITORY } from './application/ports/confirmation.repository.js';
import { PrismaConfirmationRepository } from './infrastructure/prisma-confirmation.repository.js';
import { ConfirmationController } from './interface/confirmation.controller.js';

/** Confirmation centre (#28): call queue, call outcomes and queue rules. */
@Module({
  imports: [OrdersModule],
  controllers: [ConfirmationController],
  providers: [
    ConfirmationQueue,
    LogCallUseCase,
    ConfirmationSettingsService,
    { provide: CONFIRMATION_REPOSITORY, useClass: PrismaConfirmationRepository },
  ],
})
export class ConfirmationModule {}
