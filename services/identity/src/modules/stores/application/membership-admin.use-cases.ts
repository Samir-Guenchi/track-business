import { Inject, Injectable } from '@nestjs/common';
import type { AssignableRole } from '@trackecom/contracts';
import { assertCanAssign, assertCanRemove } from '../domain/role-rules.js';
import type { StoreContext } from '../domain/store-context.js';
import { MemberNotFoundError, RoleChangeNotAllowedError } from '../domain/stores.errors.js';
import {
  type MembershipRecord,
  type MembershipRepository,
  STORES_PORTS,
} from './ports/stores.ports.js';
import { StoreAudit } from './store-audit.js';

abstract class MembershipCommand {
  constructor(
    @Inject(STORES_PORTS.memberships) protected readonly memberships: MembershipRepository,
    protected readonly audit: StoreAudit,
  ) {}

  protected async load(context: StoreContext, membershipId: string): Promise<MembershipRecord> {
    const record = await this.memberships.findById(context.storeId, membershipId);
    if (!record) throw new MemberNotFoundError();
    return record;
  }
}

@Injectable()
export class ChangeMemberRoleUseCase extends MembershipCommand {
  async execute(context: StoreContext, membershipId: string, role: AssignableRole): Promise<void> {
    const target = await this.load(context, membershipId);
    assertCanAssign(context.role, target.role, role);
    const audit = this.audit.entry(context, {
      entity: 'membership',
      entityId: target.id,
      action: 'membership.role_changed',
      before: { role: target.role },
      after: { role },
    });
    await this.memberships.changeRole(target, role, audit);
  }
}

@Injectable()
export class RemoveMemberUseCase extends MembershipCommand {
  async execute(context: StoreContext, membershipId: string): Promise<void> {
    const target = await this.load(context, membershipId);
    assertCanRemove(context.role, target.role);
    const audit = this.audit.entry(context, {
      entity: 'membership',
      entityId: target.id,
      action: 'membership.removed',
      before: { role: target.role, userId: target.userId },
    });
    await this.memberships.remove(target, audit);
  }
}

@Injectable()
export class TransferOwnershipUseCase extends MembershipCommand {
  /** The new owner takes over; the previous owner stays as a manager. */
  async execute(context: StoreContext, membershipId: string): Promise<void> {
    const from = await this.memberships.find(context.storeId, context.userId);
    const to = await this.load(context, membershipId);
    if (from?.role !== 'owner' || to.id === from.id) {
      throw new RoleChangeNotAllowedError(
        'Only the owner can transfer the store to another member',
      );
    }
    const roleChange = (id: string, before: string, after: string) =>
      this.audit.entry(context, {
        entity: 'membership',
        entityId: id,
        action: 'membership.role_changed',
        before: { role: before },
        after: { role: after },
      });
    await this.memberships.transferOwnership(from, to, [
      this.audit.entry(context, {
        entity: 'store',
        entityId: context.storeId,
        action: 'store.ownership_transferred',
        after: { ownerMembershipId: to.id },
      }),
      roleChange(from.id, 'owner', 'manager'),
      roleChange(to.id, to.role, 'owner'),
    ]);
  }
}
