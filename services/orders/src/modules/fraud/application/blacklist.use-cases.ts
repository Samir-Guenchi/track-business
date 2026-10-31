import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type {
  BlacklistEntry,
  CreateBlacklistEntryRequestSchema,
  ListBlacklistQuery,
} from '@trackecom/contracts';
import type { StoreContext } from '@trackecom/service-kit';
import type { z } from 'zod';
import { nameKey } from '../domain/risk-rules.js';
import { BlacklistEntryNotFoundError } from '../domain/fraud.errors.js';
import { type BlacklistRepository, FRAUD_PORTS } from './ports/fraud.ports.js';

type NewEntryRequest = z.output<typeof CreateBlacklistEntryRequestSchema>;

/** The store's own blacklist (#52): add, list and remove (the appeal path). */
@Injectable()
export class BlacklistUseCases {
  constructor(@Inject(FRAUD_PORTS.blacklist) private readonly blacklist: BlacklistRepository) {}

  add(store: StoreContext, request: NewEntryRequest): Promise<BlacklistEntry> {
    const name = request.name ?? null;
    return this.blacklist.create({
      id: randomUUID(),
      storeId: store.storeId,
      phone: request.phone ?? null,
      name,
      nameKey: name ? nameKey(name) : null,
      communeId: request.communeId ?? null,
      reason: request.reason,
      note: request.note ?? null,
      expiresAt: request.expiresAt ? new Date(request.expiresAt) : null,
      createdBy: store.userId,
    });
  }

  list(storeId: string, query: ListBlacklistQuery) {
    return this.blacklist.list(storeId, query);
  }

  async remove(storeId: string, id: string): Promise<void> {
    if (!(await this.blacklist.delete(storeId, id))) throw new BlacklistEntryNotFoundError();
  }
}
