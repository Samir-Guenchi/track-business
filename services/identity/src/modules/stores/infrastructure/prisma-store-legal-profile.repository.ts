import { Injectable } from '@nestjs/common';
import { LegalRegimeSchema, type StoreLegalProfile, TaxRegimeSchema } from '@trackecom/contracts';
import type { Prisma } from '../../../generated/prisma/client.js';
import { writeOutbox } from '../../../infrastructure/outbox/write-outbox.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { PrismaAuditStore } from '../../audit/prisma-audit.store.js';
import type {
  LegalProfileUpdate,
  StoreLegalProfileRepository,
} from '../application/ports/store-legal-profile.port.js';
import { EMPTY_LEGAL_PROFILE } from '../domain/store-legal-profile.js';

type Row = Prisma.StoreLegalProfileGetPayload<object>;

const toProfile = (row: Row | null): StoreLegalProfile =>
  row
    ? {
        regime: row.regime === null ? null : LegalRegimeSchema.parse(row.regime),
        taxRegime: row.taxRegime === null ? null : TaxRegimeSchema.parse(row.taxRegime),
        legalName: row.legalName,
        address: row.address,
        nif: row.nif,
        nis: row.nis,
        rcNumber: row.rcNumber,
        autoEntrepreneurCard: row.autoEntrepreneurCard,
        articleImposition: row.articleImposition,
        updatedAt: row.updatedAt.toISOString(),
      }
    : EMPTY_LEGAL_PROFILE;

@Injectable()
export class PrismaStoreLegalProfileRepository implements StoreLegalProfileRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PrismaAuditStore,
  ) {}

  async get(storeId: string): Promise<StoreLegalProfile> {
    return toProfile(await this.prisma.storeLegalProfile.findUnique({ where: { storeId } }));
  }

  update({ storeId, change, audit, event }: LegalProfileUpdate): Promise<StoreLegalProfile> {
    return this.prisma.$transaction(async (tx) => {
      const before = toProfile(await tx.storeLegalProfile.findUnique({ where: { storeId } }));
      const fields = change(before);
      const row = await tx.storeLegalProfile.upsert({
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
