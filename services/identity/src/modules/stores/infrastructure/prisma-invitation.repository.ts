import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { AuditEntry } from '@trackecom/audit';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { PrismaAuditStore } from '../../audit/prisma-audit.store.js';
import { hashToken, newRawToken } from '../../auth/infrastructure/random-token.js';
import type {
  InvitationRepository,
  NewInvitation,
  PendingInvitation,
} from '../application/ports/stores.ports.js';
import { AlreadyMemberError } from '../domain/stores.errors.js';

export const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class PrismaInvitationRepository implements InvitationRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PrismaAuditStore,
  ) {}

  async create(
    invitation: NewInvitation,
    audit: (id: string) => AuditEntry,
  ): Promise<{ id: string; token: string; expiresAt: Date }> {
    const id = randomUUID();
    const token = newRawToken();
    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
    await this.prisma.$transaction(async (tx) => {
      await tx.invitation.create({
        data: { id, ...invitation, tokenHash: hashToken(token), expiresAt },
      });
      await this.audit.record(audit(id), tx);
    });
    return { id, token, expiresAt };
  }

  findUsable(rawToken: string): Promise<PendingInvitation | null> {
    return this.prisma.invitation.findFirst({
      where: {
        tokenHash: hashToken(rawToken),
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true, storeId: true, email: true, phone: true, role: true, invitedById: true },
    });
  }

  async accept(invitation: PendingInvitation, userId: string, audit: AuditEntry): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.invitation.updateMany({
        where: { id: invitation.id, acceptedAt: null },
        data: { acceptedAt: new Date() },
      });
      const existing = await tx.membership.findUnique({
        where: { storeId_userId: { storeId: invitation.storeId, userId } },
      });
      if (claimed.count !== 1 || existing) throw new AlreadyMemberError();
      await tx.membership.create({
        data: { id: randomUUID(), storeId: invitation.storeId, userId, role: invitation.role },
      });
      await this.audit.record(audit, tx);
    });
  }

  async revoke(storeId: string, invitationId: string, audit: AuditEntry): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const revoked = await tx.invitation.updateMany({
        where: { id: invitationId, storeId, acceptedAt: null, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (revoked.count === 1) await this.audit.record(audit, tx);
      return revoked.count === 1;
    });
  }
}
