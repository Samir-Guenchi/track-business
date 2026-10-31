import type { BlacklistEntry, ListBlacklistQuery } from '@trackecom/contracts';

export interface NewBlacklistEntry {
  readonly id: string;
  readonly storeId: string;
  readonly phone: string | null;
  readonly name: string | null;
  readonly nameKey: string | null;
  readonly communeId: number | null;
  readonly reason: BlacklistEntry['reason'];
  readonly note: string | null;
  readonly expiresAt: Date | null;
  readonly createdBy: string;
}

/** Who an incoming order is for, as compared with the blacklist. */
export interface CustomerKey {
  readonly storeId: string;
  readonly phones: readonly string[];
  readonly nameKey: string;
  readonly communeId: number;
}

export interface BlacklistRepository {
  create(entry: NewBlacklistEntry): Promise<BlacklistEntry>;
  list(
    storeId: string,
    query: ListBlacklistQuery,
  ): Promise<{ items: BlacklistEntry[]; nextCursor: string | null }>;
  /** false when the store has no such entry. */
  delete(storeId: string, id: string): Promise<boolean>;
  /** True when an unexpired entry has one of the phones, or the name in that commune. */
  matches(customer: CustomerKey, now: Date): Promise<boolean>;
}

export interface RecentOrders {
  /** The store's orders from this phone created at or after `since`. */
  countByPhone(storeId: string, phone: string, since: Date): Promise<number>;
}

export const FRAUD_PORTS = {
  blacklist: Symbol('BlacklistRepository'),
  recentOrders: Symbol('RecentOrders'),
} as const;
