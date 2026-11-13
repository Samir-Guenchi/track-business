import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module.js';
import { CopyLegalProfileUseCase } from './application/copy-legal-profile.use-case.js';
import { InvoiceUseCases } from './application/invoice.use-cases.js';
import { INVOICES } from './application/ports/invoices.port.js';
import { LEGAL_COPIES } from './application/ports/legal-copy.port.js';
import { LegalCopyConsumer } from './infrastructure/legal-copy.consumer.js';
import { PrismaInvoiceRepository } from './infrastructure/prisma-invoice.repository.js';
import { PrismaLegalCopyRepository } from './infrastructure/prisma-legal-copy.repository.js';
import { InvoicesController } from './interface/invoices.controller.js';

/** Invoices and credit notes (#140), printed with the store's legal profile. */
@Module({
  imports: [OrdersModule],
  controllers: [InvoicesController],
  providers: [
    InvoiceUseCases,
    CopyLegalProfileUseCase,
    LegalCopyConsumer,
    { provide: INVOICES, useClass: PrismaInvoiceRepository },
    { provide: LEGAL_COPIES, useClass: PrismaLegalCopyRepository },
  ],
})
export class InvoicesModule {}
