import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { CarrierFactsSource, RouteQuery } from '../application/ports/suggestion.ports.js';
import type { CarrierFacts } from '../domain/carrier-facts.js';
import { type CarrierStats, networkStats, storeStats } from './delivery-stats.js';

const byCarrier = (rows: readonly CarrierStats[]) => new Map(rows.map((row) => [row.carrier, row]));
const rateOf = (row: CarrierStats | undefined) =>
  row ? row.delivered / (row.delivered + row.returned) : null;

const recordOf = (own: CarrierStats | undefined) =>
  own ? { delivered: own.delivered, returned: own.returned } : { delivered: 0, returned: 0 };

interface Sources {
  readonly costs: ReadonlyMap<string, number>;
  readonly mine: ReadonlyMap<string, CarrierStats>;
  readonly network: ReadonlyMap<string, CarrierStats>;
  readonly desks: ReadonlyMap<string, boolean>;
}

function factsFor(carrier: string, sources: Sources): CarrierFacts {
  const own = sources.mine.get(carrier);
  const network = sources.network.get(carrier);
  return {
    carrier,
    cost: sources.costs.get(carrier) ?? null,
    store: recordOf(own),
    networkRate: rateOf(network),
    averageDays: own?.avgDays ?? network?.avgDays ?? null,
    stopDesk: sources.desks.get(carrier) ?? null,
  };
}

/** Reads the store's carriers, its rate card, delivery history and stop desks for one route. */
@Injectable()
export class PrismaCarrierFacts implements CarrierFactsSource {
  constructor(private readonly prisma: PrismaService) {}

  async gather(route: RouteQuery): Promise<CarrierFacts[]> {
    const accounts = await this.prisma.carrierAccount.findMany({
      where: { storeId: route.storeId },
      select: { carrier: true },
      orderBy: { carrier: 'asc' },
    });
    const carriers = accounts.map((account) => account.carrier);
    if (carriers.length === 0) return [];
    const query = { wilayaCode: route.wilayaCode, carriers };
    const [costs, mine, network, desks] = await Promise.all([
      this.costs(route, carriers),
      storeStats(this.prisma, { ...query, storeId: route.storeId }).then(byCarrier),
      networkStats(this.prisma, query).then(byCarrier),
      this.stopDesks(route.wilayaCode, carriers),
    ]);
    return carriers.map((carrier) => factsFor(carrier, { costs, mine, network, desks }));
  }

  private async costs(route: RouteQuery, carriers: string[]): Promise<Map<string, number>> {
    const rows = await this.prisma.rateCard.findMany({
      where: {
        storeId: route.storeId,
        carrier: { in: carriers },
        fromWilaya: route.originWilayaCode,
        toWilaya: route.wilayaCode,
        deliveryType: route.deliveryType,
      },
      select: { carrier: true, price: true },
    });
    return new Map(rows.map((row) => [row.carrier, row.price]));
  }

  /** true/false for carriers that publish stop desks; carriers that publish none are unknown. */
  private async stopDesks(wilayaCode: number, carriers: string[]): Promise<Map<string, boolean>> {
    const active = { carrier: { in: carriers }, isActive: true };
    const select = { carrier: true } as const;
    const [anywhere, here] = await Promise.all([
      this.prisma.stopDesk.findMany({ where: active, distinct: ['carrier'], select }),
      this.prisma.stopDesk.findMany({
        where: { ...active, commune: { wilayaCode } },
        distinct: ['carrier'],
        select,
      }),
    ]);
    const local = new Set(here.map((row) => row.carrier));
    return new Map(anywhere.map((row) => [row.carrier, local.has(row.carrier)]));
  }
}
