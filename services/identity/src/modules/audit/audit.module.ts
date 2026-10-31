import { Module } from '@nestjs/common';
import { AUDIT_RECORDER, AUDIT_TRAIL_READER } from '@trackecom/audit';
import { PrismaAuditStore } from './prisma-audit.store.js';

/** Audit trail of identity (role changes, invitations, ownership transfers...). */
@Module({
  providers: [
    PrismaAuditStore,
    { provide: AUDIT_RECORDER, useExisting: PrismaAuditStore },
    { provide: AUDIT_TRAIL_READER, useExisting: PrismaAuditStore },
  ],
  exports: [PrismaAuditStore, AUDIT_RECORDER, AUDIT_TRAIL_READER],
})
export class AuditModule {}
