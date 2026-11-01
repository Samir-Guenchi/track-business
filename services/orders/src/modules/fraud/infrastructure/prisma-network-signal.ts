import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { NetworkSignal } from '../application/ports/fraud.ports.js';
import { NETWORK_STORE_THRESHOLD } from '../domain/risk-rules.js';

/**
 * The one query in orders that looks past the caller's store, on purpose (#52). It returns a
 * count only, never which stores or which orders, and stops counting at the flag threshold.
 * Wired only when NETWORK_SIGNAL_ENABLED is true.
 */
@Injectable()
export class PrismaNetworkSignal implements NetworkSignal {
  constructor(private readonly prisma: PrismaService) {}

  async refusingStores(storeId: string, phone: string): Promise<number> {
    const stores = await this.prisma.order.findMany({
      where: { customerPhone: phone, status: 'returned', storeId: { not: storeId } },
      distinct: ['storeId'],
      select: { storeId: true },
      take: NETWORK_STORE_THRESHOLD,
    });
    return stores.length;
  }
}

/** The default: the shared signal is off and never raises a flag. */
export const disabledNetworkSignal: NetworkSignal = {
  refusingStores: () => Promise.resolve(0),
};
