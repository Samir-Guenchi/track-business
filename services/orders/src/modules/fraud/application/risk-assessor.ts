import { Inject, Injectable } from '@nestjs/common';
import type { Customer, RiskFlag } from '@trackecom/contracts';
import { BURST_WINDOW_MS, assessRisk, nameKey } from '../domain/risk-rules.js';
import { type BlacklistRepository, FRAUD_PORTS, type RecentOrders } from './ports/fraud.ports.js';

type OrderCustomer = Pick<Customer, 'name' | 'phone' | 'phone2' | 'communeId'>;

/** Runs the fake-order checks on an incoming order (#52), before it reaches the agent queue. */
@Injectable()
export class RiskAssessor {
  constructor(
    @Inject(FRAUD_PORTS.blacklist) private readonly blacklist: BlacklistRepository,
    @Inject(FRAUD_PORTS.recentOrders) private readonly orders: RecentOrders,
  ) {}

  async assess(storeId: string, customer: OrderCustomer, now: Date): Promise<RiskFlag[]> {
    const phones = [customer.phone, ...(customer.phone2 ? [customer.phone2] : [])];
    const since = new Date(now.getTime() - BURST_WINDOW_MS);
    const [blacklisted, recentOrders] = await Promise.all([
      this.blacklist.matches(
        { storeId, phones, nameKey: nameKey(customer.name), communeId: customer.communeId },
        now,
      ),
      this.orders.countByPhone(storeId, customer.phone, since),
    ]);
    return assessRisk({ phone: customer.phone, name: customer.name, blacklisted, recentOrders });
  }
}
