import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { AuditEntry } from '@trackecom/audit';
import type { Store, StoreRole } from '@trackecom/contracts';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { PrismaAuditStore } from '../../audit/prisma-audit.store.js';
import type { StoreRepository } from '../application/ports/stores.ports.js';

const toStore = (row: { id: string; name: string; createdAt: Date }): Store => ({
  id: row.id,
  name: row.name,
  createdAt: row.createdAt.toISOString(),
});

@Injectable()
export class PrismaStoreRepository implements StoreRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PrismaAuditStore,
  ) {}

  async createWithOwner(input: {
    name: string;
    ownerId: string;
    audit: (storeId: string) => AuditEntry;
  }): Promise<Store> {
    const storeId = randomUUID();
    const row = await this.prisma.$transaction(async (tx) => {
      const store = await tx.store.create({ data: { id: storeId, name: input.name } });
      await tx.membership.create({
        data: { id: randomUUID(), storeId, userId: input.ownerId, role: 'owner' },
      });
      await this.audit.record(input.audit(storeId), tx);
      return store;
    });
    return toStore(row);
  }

  async listForUser(userId: string): Promise<{ store: Store; role: StoreRole }[]> {
    const rows = await this.prisma.membership.findMany({
      where: { userId },
      include: { store: true },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => ({ store: toStore(row.store), role: row.role }));
  }
}
