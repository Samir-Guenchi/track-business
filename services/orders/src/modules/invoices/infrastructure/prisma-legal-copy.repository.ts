import { Injectable } from '@nestjs/common';
import { type StoreLegalProfile, StoreLegalProfileSchema } from '@trackecom/contracts';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { LegalCopyRepository } from '../application/ports/legal-copy.port.js';

@Injectable()
export class PrismaLegalCopyRepository implements LegalCopyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(storeId: string, profile: StoreLegalProfile, sourceAt: Date): Promise<boolean> {
    const updated = await this.prisma.storeLegalCopy.updateMany({
      where: { storeId, sourceAt: { lt: sourceAt } },
      data: { profile, sourceAt },
    });
    if (updated.count > 0) return true;
    const created = await this.prisma.storeLegalCopy.createMany({
      data: [{ storeId, profile, sourceAt }],
      skipDuplicates: true,
    });
    return created.count > 0;
  }

  async find(storeId: string): Promise<StoreLegalProfile | null> {
    const row = await this.prisma.storeLegalCopy.findUnique({ where: { storeId } });
    return row ? StoreLegalProfileSchema.parse(row.profile) : null;
  }
}
