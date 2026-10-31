import { Injectable } from '@nestjs/common';
import type { AuditEntry } from '@trackecom/audit';
import type { Member, StoreRole } from '@trackecom/contracts';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { PrismaAuditStore } from '../../audit/prisma-audit.store.js';
import type { MembershipRecord, MembershipRepository } from '../application/ports/stores.ports.js';

const RECORD = { id: true, storeId: true, userId: true, role: true } as const;

@Injectable()
export class PrismaMembershipRepository implements MembershipRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PrismaAuditStore,
  ) {}

  find(storeId: string, userId: string): Promise<MembershipRecord | null> {
    return this.prisma.membership.findUnique({
      where: { storeId_userId: { storeId, userId } },
      select: RECORD,
    });
  }

  /** Loaded by id AND store: an id from another store is simply not found (IDOR). */
  findById(storeId: string, membershipId: string): Promise<MembershipRecord | null> {
    return this.prisma.membership.findFirst({
      where: { id: membershipId, storeId },
      select: RECORD,
    });
  }

  async list(storeId: string): Promise<Member[]> {
    const rows = await this.prisma.membership.findMany({
      where: { storeId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => ({
      membershipId: row.id,
      userId: row.userId,
      name: row.user.name,
      email: row.user.email,
      role: row.role,
      joinedAt: row.createdAt.toISOString(),
    }));
  }

  async changeRole(record: MembershipRecord, role: StoreRole, audit: AuditEntry): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.membership.update({
        where: { id: record.id, storeId: record.storeId },
        data: { role },
      });
      await this.audit.record(audit, tx);
    });
  }

  async remove(record: MembershipRecord, audit: AuditEntry): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.membership.delete({ where: { id: record.id, storeId: record.storeId } });
      await this.audit.record(audit, tx);
    });
  }

  async transferOwnership(
    from: MembershipRecord,
    to: MembershipRecord,
    audits: readonly AuditEntry[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.membership.update({
        where: { id: from.id, storeId: from.storeId },
        data: { role: 'manager' },
      });
      await tx.membership.update({
        where: { id: to.id, storeId: to.storeId },
        data: { role: 'owner' },
      });
      for (const audit of audits) await this.audit.record(audit, tx);
    });
  }
}
