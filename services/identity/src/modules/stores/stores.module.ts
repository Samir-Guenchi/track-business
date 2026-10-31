import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { AuthModule } from '../auth/auth.module.js';
import {
  AcceptInvitationUseCase,
  InviteMemberUseCase,
  RevokeInvitationUseCase,
} from './application/invitation.use-cases.js';
import { InvitationNotifier } from './application/invitation.notifier.js';
import {
  ChangeMemberRoleUseCase,
  RemoveMemberUseCase,
  TransferOwnershipUseCase,
} from './application/membership-admin.use-cases.js';
import { STORES_PORTS } from './application/ports/stores.ports.js';
import { StoreAudit } from './application/store-audit.js';
import {
  CreateStoreUseCase,
  ListMembersUseCase,
  ListMyStoresUseCase,
} from './application/store.use-cases.js';
import { PrismaInvitationRepository } from './infrastructure/prisma-invitation.repository.js';
import { PrismaMembershipRepository } from './infrastructure/prisma-membership.repository.js';
import { PrismaStoreRepository } from './infrastructure/prisma-store.repository.js';
import { InvitationsController } from './interface/invitations.controller.js';
import { MembersController } from './interface/members.controller.js';
import { StoresController } from './interface/stores.controller.js';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [StoresController, MembersController, InvitationsController],
  providers: [
    StoreAudit,
    InvitationNotifier,
    CreateStoreUseCase,
    ListMyStoresUseCase,
    ListMembersUseCase,
    ChangeMemberRoleUseCase,
    RemoveMemberUseCase,
    TransferOwnershipUseCase,
    InviteMemberUseCase,
    AcceptInvitationUseCase,
    RevokeInvitationUseCase,
    { provide: STORES_PORTS.stores, useClass: PrismaStoreRepository },
    { provide: STORES_PORTS.memberships, useClass: PrismaMembershipRepository },
    { provide: STORES_PORTS.invitations, useClass: PrismaInvitationRepository },
  ],
  exports: [STORES_PORTS.memberships],
})
export class StoresModule {}
