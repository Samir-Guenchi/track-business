import { Module } from '@nestjs/common';
import { CopyLegalProfileUseCase } from './application/copy-legal-profile.use-case.js';
import { LEGAL_COPIES } from './application/ports/legal-copy.port.js';
import { LegalCopyConsumer } from './infrastructure/legal-copy.consumer.js';
import { PrismaLegalCopyRepository } from './infrastructure/prisma-legal-copy.repository.js';

/** Invoices and credit notes (#140), printed with the store's legal profile. */
@Module({
  providers: [
    CopyLegalProfileUseCase,
    LegalCopyConsumer,
    { provide: LEGAL_COPIES, useClass: PrismaLegalCopyRepository },
  ],
})
export class InvoicesModule {}
