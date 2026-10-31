import type { AuditEntry } from '@trackecom/audit';
import type { Member, Store, StoreRole } from '@trackecom/contracts';

export interface MembershipRecord {
  readonly id: string;
  readonly storeId: string;
  readonly userId: string;
  readonly role: StoreRole;
}

export interface StoreRepository {
  createWithOwner(input: {
    name: string;
    ownerId: string;
    audit: (storeId: string) => AuditEntry;
  }): Promise<Store>;
  listForUser(userId: string): Promise<{ store: Store; role: StoreRole }[]>;
}

/** Every method is scoped by `storeId`; writes record their audit entry in the same transaction. */
export interface MembershipRepository {
  find(storeId: string, userId: string): Promise<MembershipRecord | null>;
  findById(storeId: string, membershipId: string): Promise<MembershipRecord | null>;
  list(storeId: string): Promise<Member[]>;
  changeRole(record: MembershipRecord, role: StoreRole, audit: AuditEntry): Promise<void>;
  remove(record: MembershipRecord, audit: AuditEntry): Promise<void>;
  transferOwnership(
    from: MembershipRecord,
    to: MembershipRecord,
    audits: readonly AuditEntry[],
  ): Promise<void>;
}

export interface NewInvitation {
  readonly storeId: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly role: StoreRole;
  readonly invitedById: string;
}

export interface PendingInvitation extends NewInvitation {
  readonly id: string;
}

export interface InvitationRepository {
  create(
    invitation: NewInvitation,
    audit: (id: string) => AuditEntry,
  ): Promise<{ id: string; token: string; expiresAt: Date }>;
  findUsable(rawToken: string): Promise<PendingInvitation | null>;
  /** Marks the invitation accepted and creates the membership, atomically. */
  accept(invitation: PendingInvitation, userId: string, audit: AuditEntry): Promise<void>;
  revoke(storeId: string, invitationId: string, audit: AuditEntry): Promise<boolean>;
}

export const STORES_PORTS = {
  stores: Symbol('StoreRepository'),
  memberships: Symbol('MembershipRepository'),
  invitations: Symbol('InvitationRepository'),
} as const;
