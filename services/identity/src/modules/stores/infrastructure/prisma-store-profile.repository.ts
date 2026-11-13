import { Injectable } from '@nestjs/common';
import {
  DailyVolumeSchema,
  LocaleSchema,
  type StoreProfile,
  WilayaCodeSchema,
} from '@trackecom/contracts';
import type { Prisma } from '../../../generated/prisma/client.js';
import { writeOutbox } from '../../../infrastructure/outbox/write-outbox.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { PrismaAuditStore } from '../../audit/prisma-audit.store.js';
import type {
  ProfileUpdate,
  StoreProfileRepository,
} from '../application/ports/store-profile.port.js';
import { EMPTY_PROFILE } from '../domain/store-profile.js';

type Row = Prisma.StoreProfileGetPayload<object>;

const toProfile = (row: Row | null): StoreProfile =>
  row
    ? {
        originWilayaCode:
          row.originWilayaCode === null ? null : WilayaCodeSchema.parse(row.originWilayaCode),
        originCommuneId: row.originCommuneId,
        contactPhone: row.contactPhone,
        logoUrl: row.logoUrl,
        dailyVolume: row.dailyVolume === null ? null : DailyVolumeSchema.parse(row.dailyVolume),
        carriers: row.carriers,
        defaultLanguage: LocaleSchema.parse(row.defaultLanguage),
        updatedAt: row.updatedAt.toISOString(),
      }
    : EMPTY_PROFILE;

@Injectable()
export class PrismaStoreProfileRepository implements StoreProfileRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PrismaAuditStore,
  ) {}

  async get(storeId: string): Promise<StoreProfile> {
    return toProfile(await this.prisma.storeProfile.findUnique({ where: { storeId } }));
  }

  update({ storeId, change, audit, event }: ProfileUpdate): Promise<StoreProfile> {
    return this.prisma.$transaction(async (tx) => {
      const before = toProfile(await tx.storeProfile.findUnique({ where: { storeId } }));
      const fields = change(before);
      const row = await tx.storeProfile.upsert({
        where: { storeId },
        create: { storeId, ...fields },
        update: fields,
      });
      const after = toProfile(row);
      await this.audit.record(audit(before, after), tx);
      await writeOutbox(tx, [event(after)]);
      return after;
    });
  }
}
