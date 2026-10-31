import { Inject, Injectable } from '@nestjs/common';
import type { Member, MyStoresResponse, Store } from '@trackecom/contracts';
import type { StoreContext } from '../domain/store-context.js';
import {
  type MembershipRepository,
  STORES_PORTS,
  type StoreRepository,
} from './ports/stores.ports.js';
import { StoreAudit } from './store-audit.js';

@Injectable()
export class CreateStoreUseCase {
  constructor(
    @Inject(STORES_PORTS.stores) private readonly stores: StoreRepository,
    private readonly audit: StoreAudit,
  ) {}

  /** The creator becomes the owner. */
  execute(input: { name: string; userId: string; ip: string | null }): Promise<Store> {
    return this.stores.createWithOwner({
      name: input.name,
      ownerId: input.userId,
      audit: (storeId) =>
        this.audit.entry(
          { storeId, userId: input.userId, ip: input.ip },
          {
            entity: 'store',
            entityId: storeId,
            action: 'store.created',
            after: { name: input.name },
          },
        ),
    });
  }
}

@Injectable()
export class ListMyStoresUseCase {
  constructor(@Inject(STORES_PORTS.stores) private readonly stores: StoreRepository) {}

  async execute(userId: string): Promise<MyStoresResponse> {
    return { items: await this.stores.listForUser(userId) };
  }
}

@Injectable()
export class ListMembersUseCase {
  constructor(
    @Inject(STORES_PORTS.memberships) private readonly memberships: MembershipRepository,
  ) {}

  execute(context: StoreContext): Promise<Member[]> {
    return this.memberships.list(context.storeId);
  }
}
