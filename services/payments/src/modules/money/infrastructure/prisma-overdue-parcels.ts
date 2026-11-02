import { Injectable } from '@nestjs/common';
import { MoneySettingsSchema } from '@trackecom/contracts';
import { writeOutbox } from '../../../infrastructure/outbox/write-outbox.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { ParcelRecord } from '../application/ports/money.repository.js';
import type { OverdueParcels } from '../application/ports/money-reads.js';

const DEFAULT_DAYS = MoneySettingsSchema.parse({}).missingAfterDays;

/** One statement picks, locks and moves overdue parcels; replicas skip each other's rows. */
@Injectable()
export class PrismaOverdueParcels implements OverdueParcels {
  constructor(private readonly prisma: PrismaService) {}

  flagMissing(input: Parameters<OverdueParcels['flagMissing']>[0]): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const parcels = await tx.$queryRaw<ParcelRecord[]>`
        UPDATE parcels SET status = 'missing', updated_at = now()
        WHERE id IN (
          SELECT p.id FROM parcels p
          LEFT JOIN money_settings s ON s.store_id = p.store_id
          WHERE p.status = 'awaiting_payout'
            AND p.delivered_at < now()
              - make_interval(days => COALESCE(s.missing_after_days, ${DEFAULT_DAYS}::int))
          ORDER BY p.delivered_at
          LIMIT ${input.limit}
          FOR UPDATE OF p SKIP LOCKED
        )
        RETURNING id, store_id AS "storeId", carrier, tracking_number AS "trackingNumber",
          order_id AS "orderId", expected_cod AS "expectedCod", status,
          delivered_at AS "deliveredAt", received_cod AS "receivedCod", fees,
          payout_id AS "payoutId"`;
      await writeOutbox(tx, input.outbox(parcels));
      return parcels.length;
    });
  }
}
