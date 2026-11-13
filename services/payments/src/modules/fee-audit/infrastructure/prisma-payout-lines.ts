import { Injectable } from '@nestjs/common';
import { PayoutLineInputSchema } from '@trackecom/contracts';
import { z } from 'zod';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { PayoutLines } from '../application/fee-audit.use-case.js';

const LinesSchema = z.array(PayoutLineInputSchema);

@Injectable()
export class PrismaPayoutLines implements PayoutLines {
  constructor(private readonly prisma: PrismaService) {}

  async find(storeId: string, payoutId: string) {
    const row = await this.prisma.payout.findFirst({
      where: { id: payoutId, storeId },
      select: { carrier: true, lines: true },
    });
    return row ? { carrier: row.carrier, lines: LinesSchema.parse(row.lines) } : null;
  }
}
