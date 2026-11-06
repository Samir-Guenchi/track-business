import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { StoreOrigin, StoreOriginStore } from '../application/store-origin.port.js';

@Injectable()
export class PrismaStoreOriginStore implements StoreOriginStore {
  constructor(private readonly prisma: PrismaService) {}

  async originWilaya(storeId: string): Promise<number | null> {
    const row = await this.prisma.storeOrigin.findUnique({
      where: { storeId },
      select: { originWilayaCode: true },
    });
    return row?.originWilayaCode ?? null;
  }

  /** One statement, so two replicas applying events out of order still keep the newest. */
  async apply(storeId: string, origin: StoreOrigin, at: Date): Promise<boolean> {
    const changed = await this.prisma.$executeRaw`
      INSERT INTO store_origins (store_id, origin_wilaya_code, origin_commune_id, updated_at)
      VALUES (${storeId}::uuid, ${origin.wilayaCode}, ${origin.communeId}, ${at})
      ON CONFLICT (store_id) DO UPDATE SET
        origin_wilaya_code = EXCLUDED.origin_wilaya_code,
        origin_commune_id = EXCLUDED.origin_commune_id,
        updated_at = EXCLUDED.updated_at
      WHERE store_origins.updated_at < EXCLUDED.updated_at`;
    return changed === 1;
  }
}
