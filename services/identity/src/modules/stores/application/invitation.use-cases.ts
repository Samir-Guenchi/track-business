import { Inject, Injectable } from '@nestjs/common';
import type { CreateInvitationRequest, InvitationCreatedResponse } from '@trackecom/contracts';
import { AUTH_PORTS, type UserRepository } from '../../auth/application/ports/auth.ports.js';
import { assertCanAssign } from '../domain/role-rules.js';
import type { StoreContext } from '../domain/store-context.js';
import { AccessDeniedError, InvitationInvalidError } from '../domain/stores.errors.js';
import { InvitationNotifier } from './invitation.notifier.js';
import {
  type InvitationRepository,
  type PendingInvitation,
  STORES_PORTS,
} from './ports/stores.ports.js';
import { StoreAudit } from './store-audit.js';

@Injectable()
export class InviteMemberUseCase {
  constructor(
    @Inject(STORES_PORTS.invitations) private readonly invitations: InvitationRepository,
    private readonly audit: StoreAudit,
    private readonly notifier: InvitationNotifier,
  ) {}

  async execute(
    context: StoreContext,
    request: CreateInvitationRequest,
  ): Promise<InvitationCreatedResponse> {
    assertCanAssign(context.role, null, request.role);
    const invitation = {
      storeId: context.storeId,
      email: request.email ?? null,
      phone: request.phone ?? null,
      role: request.role,
      invitedById: context.userId,
    };
    const created = await this.invitations.create(invitation, (id) =>
      this.audit.entry(context, {
        entity: 'invitation',
        entityId: id,
        action: 'invitation.created',
        after: { role: request.role, email: invitation.email, phone: invitation.phone },
      }),
    );
    const inviteUrl = await this.notifier.notify(invitation, created.token);
    return { invitationId: created.id, inviteUrl, expiresAt: created.expiresAt.toISOString() };
  }
}

@Injectable()
export class AcceptInvitationUseCase {
  constructor(
    @Inject(STORES_PORTS.invitations) private readonly invitations: InvitationRepository,
    @Inject(AUTH_PORTS.users) private readonly users: UserRepository,
    private readonly audit: StoreAudit,
  ) {}

  /** The invitation is bound to an email or phone: only that person can use the link. */
  async execute(input: {
    token: string;
    userId: string;
    ip: string | null;
  }): Promise<{ storeId: string }> {
    const invitation = await this.invitations.findUsable(input.token);
    const user = await this.users.findById(input.userId);
    if (!invitation || !user) throw new InvitationInvalidError();
    if (!this.isAddressedTo(invitation, user)) throw new AccessDeniedError();
    const context = { storeId: invitation.storeId, userId: user.id, ip: input.ip };
    const audit = this.audit.entry(context, {
      entity: 'invitation',
      entityId: invitation.id,
      action: 'invitation.accepted',
      after: { role: invitation.role },
    });
    await this.invitations.accept(invitation, user.id, audit);
    return { storeId: invitation.storeId };
  }

  private isAddressedTo(
    invitation: PendingInvitation,
    user: { email: string; phone: string | null; emailVerifiedAt: Date | null },
  ): boolean {
    if (invitation.email) return invitation.email === user.email && user.emailVerifiedAt !== null;
    return invitation.phone !== null && invitation.phone === user.phone;
  }
}

@Injectable()
export class RevokeInvitationUseCase {
  constructor(
    @Inject(STORES_PORTS.invitations) private readonly invitations: InvitationRepository,
    private readonly audit: StoreAudit,
  ) {}

  async execute(context: StoreContext, invitationId: string): Promise<void> {
    const audit = this.audit.entry(context, {
      entity: 'invitation',
      entityId: invitationId,
      action: 'invitation.revoked',
    });
    if (!(await this.invitations.revoke(context.storeId, invitationId, audit)))
      throw new InvitationInvalidError();
  }
}
