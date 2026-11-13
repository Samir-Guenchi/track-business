import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { LinkStore, NewLink } from '../application/link-store.port.js';
import type { LinkRecord } from '../domain/self-confirm.js';

const LINK_FIELDS = { id: true, storeId: true, orderId: true, expiresAt: true, usedAt: true };

@Injectable()
export class PrismaLinkStore implements LinkStore {
  constructor(private readonly prisma: PrismaService) {}

  async save(link: NewLink): Promise<void> {
    await this.prisma.confirmationLink.create({ data: link });
  }

  findByTokenHash(tokenHash: string): Promise<LinkRecord | null> {
    return this.prisma.confirmationLink.findUnique({ where: { tokenHash }, select: LINK_FIELDS });
  }

  async markUsed(id: string, at: Date): Promise<boolean> {
    const { count } = await this.prisma.confirmationLink.updateMany({
      where: { id, usedAt: null },
      data: { usedAt: at },
    });
    return count === 1;
  }

  async unmarkUsed(id: string): Promise<void> {
    await this.prisma.confirmationLink.update({ where: { id }, data: { usedAt: null } });
  }
}
