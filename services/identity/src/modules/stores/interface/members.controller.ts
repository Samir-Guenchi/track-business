import { Body, Controller, Delete, HttpCode, Param, Patch, Post } from '@nestjs/common';
import {
  type ChangeRoleRequest,
  ChangeRoleRequestSchema,
  type TransferOwnershipRequest,
  TransferOwnershipRequestSchema,
} from '@trackecom/contracts';
import { RequirePermission, ZodValidationPipe } from '@trackecom/service-kit';
import { z } from 'zod';
import { CurrentStore } from '../../../authorization/request-context.js';
import {
  ChangeMemberRoleUseCase,
  RemoveMemberUseCase,
  TransferOwnershipUseCase,
} from '../application/membership-admin.use-cases.js';
import type { StoreContext } from '../domain/store-context.js';

const IdPipe = new ZodValidationPipe(z.uuid());

@Controller('stores/current')
export class MembersController {
  constructor(
    private readonly changeRole: ChangeMemberRoleUseCase,
    private readonly removeMember: RemoveMemberUseCase,
    private readonly transfer: TransferOwnershipUseCase,
  ) {}

  @Patch('members/:membershipId')
  @HttpCode(204)
  @RequirePermission('members.manage')
  async updateRole(
    @CurrentStore() store: StoreContext,
    @Param('membershipId', IdPipe) membershipId: string,
    @Body(new ZodValidationPipe(ChangeRoleRequestSchema)) body: ChangeRoleRequest,
  ): Promise<void> {
    await this.changeRole.execute(store, membershipId, body.role);
  }

  @Delete('members/:membershipId')
  @HttpCode(204)
  @RequirePermission('members.manage')
  async remove(
    @CurrentStore() store: StoreContext,
    @Param('membershipId', IdPipe) membershipId: string,
  ): Promise<void> {
    await this.removeMember.execute(store, membershipId);
  }

  @Post('transfer-ownership')
  @HttpCode(204)
  @RequirePermission('store.transfer')
  async transferOwnership(
    @CurrentStore() store: StoreContext,
    @Body(new ZodValidationPipe(TransferOwnershipRequestSchema)) body: TransferOwnershipRequest,
  ): Promise<void> {
    await this.transfer.execute(store, body.membershipId);
  }
}
