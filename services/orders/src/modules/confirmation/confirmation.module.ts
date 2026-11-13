import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module.js';
import { BestTimeService } from './application/best-time.service.js';
import { ConfirmationContentService } from './application/confirmation-content.service.js';
import { ConfirmationQueue } from './application/confirmation-queue.js';
import { QueueItemReader } from './application/queue-item.reader.js';
import { ConfirmationSettingsService } from './application/confirmation-settings.service.js';
import { LogCallUseCase } from './application/log-call.use-case.js';
import { CONFIRMATION_CONTENT } from './application/ports/confirmation-content.repository.js';
import { CONFIRMATION_REPOSITORY } from './application/ports/confirmation.repository.js';
import { PrismaConfirmationContentRepository } from './infrastructure/prisma-confirmation-content.repository.js';
import { PrismaConfirmationRepository } from './infrastructure/prisma-confirmation.repository.js';
import { ConfirmationAdminController } from './interface/confirmation-admin.controller.js';
import { ConfirmationController } from './interface/confirmation.controller.js';

/** Confirmation centre (#28): call queue, call outcomes, queue rules, scripts, stats. */
@Module({
  imports: [OrdersModule],
  controllers: [ConfirmationController, ConfirmationAdminController],
  providers: [
    ConfirmationQueue,
    QueueItemReader,
    LogCallUseCase,
    ConfirmationSettingsService,
    ConfirmationContentService,
    BestTimeService,
    { provide: CONFIRMATION_REPOSITORY, useClass: PrismaConfirmationRepository },
    { provide: CONFIRMATION_CONTENT, useClass: PrismaConfirmationContentRepository },
  ],
})
export class ConfirmationModule {}
