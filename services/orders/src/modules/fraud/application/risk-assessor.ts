import { Inject, Injectable } from '@nestjs/common';
import type { Customer, RiskFlag } from '@trackecom/contracts';
import { BURST_WINDOW_MS, assessRisk, nameKey } from '../domain/risk-rules.js';
import {
  type BlacklistRepository,
  FRAUD_PORTS,
  type GeoDirectory,
  type NetworkSignal,
  type RecentOrders,
} from './ports/fraud.ports.js';

type OrderCustomer = Pick<Customer, 'name' | 'phone' | 'phone2' | 'communeId' | 'wilayaCode'>;

/** The checks that read other data than the order itself. */
export interface RiskSources {
  readonly blacklist: BlacklistRepository;
  readonly orders: RecentOrders;
  readonly geo: GeoDirectory;
  readonly network: NetworkSignal;
}

/** Runs the fake-order checks on an incoming order (#52), before it reaches the agent queue. */
@Injectable()
export class RiskAssessor {
  constructor(@Inject(FRAUD_PORTS.sources) private readonly sources: RiskSources) {}

  async assess(storeId: string, customer: OrderCustomer, now: Date): Promise<RiskFlag[]> {
    const { blacklist, orders, geo, network } = this.sources;
    const phones = [customer.phone, ...(customer.phone2 ? [customer.phone2] : [])];
    const since = new Date(now.getTime() - BURST_WINDOW_MS);
    const key = { storeId, phones, nameKey: nameKey(customer.name), communeId: customer.communeId };
    const [blacklisted, recentOrders, communeInWilaya, refusingStores] = await Promise.all([
      blacklist.matches(key, now),
      orders.countByPhone(storeId, customer.phone, since),
      geo.communeInWilaya(customer.wilayaCode, customer.communeId),
      network.refusingStores(storeId, customer.phone),
    ]);
    const facts = { phone: customer.phone, name: customer.name, blacklisted, recentOrders };
    return assessRisk({ ...facts, communeInWilaya, refusingStores });
  }
}
