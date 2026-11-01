import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module.js';
import { CreateLinkUseCase } from './application/create-link.use-case.js';
import { LINK_STORE } from './application/link-store.port.js';
import { SelfConfirmUseCases } from './application/self-confirm.use-cases.js';
import { PrismaLinkStore } from './infrastructure/prisma-link.store.js';
import { ConfirmationLinkController } from './interface/confirmation-link.controller.js';
import { SelfConfirmController } from './interface/self-confirm.controller.js';

/** Customer self-confirmation links (#54): created by agents, answered on a public page. */
@Module({
  imports: [OrdersModule],
  controllers: [ConfirmationLinkController, SelfConfirmController],
  providers: [
    CreateLinkUseCase,
    SelfConfirmUseCases,
    { provide: LINK_STORE, useClass: PrismaLinkStore },
  ],
})
export class SelfConfirmModule {}
