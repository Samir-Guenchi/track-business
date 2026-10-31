import { Body, Controller, Delete, HttpCode, Param, Post } from '@nestjs/common';
import {
  type AcceptInvitationRequest,
  AcceptInvitationRequestSchema,
  type CreateInvitationRequest,
  CreateInvitationRequestSchema,
  type InvitationCreatedResponse,
} from '@trackecom/contracts';
import { Authenticated, RequirePermission, ZodValidationPipe } from '@trackecom/service-kit';
import { z } from 'zod';
import { ClientIp, CurrentStore, CurrentUserId } from '../../../authorization/request-context.js';
import {
  AcceptInvitationUseCase,
  InviteMemberUseCase,
  RevokeInvitationUseCase,
} from '../application/invitation.use-cases.js';
import type { StoreContext } from '../domain/store-context.js';

@Controller()
export class InvitationsController {
  constructor(
    private readonly invite: InviteMemberUseCase,
    private readonly accept: AcceptInvitationUseCase,
    private readonly revoke: RevokeInvitationUseCase,
  ) {}

  @Post('stores/current/invitations')
  @RequirePermission('members.manage')
  create(
    @CurrentStore() store: StoreContext,
    @Body(new ZodValidationPipe(CreateInvitationRequestSchema)) body: CreateInvitationRequest,
  ): Promise<InvitationCreatedResponse> {
    return this.invite.execute(store, body);
  }

  @Delete('stores/current/invitations/:invitationId')
  @HttpCode(204)
  @RequirePermission('members.manage')
  async cancel(
    @CurrentStore() store: StoreContext,
    @Param('invitationId', new ZodValidationPipe(z.uuid())) invitationId: string,
  ): Promise<void> {
    await this.revoke.execute(store, invitationId);
  }

  @Post('invitations/accept')
  @Authenticated()
  acceptInvitation(
    @Body(new ZodValidationPipe(AcceptInvitationRequestSchema)) body: AcceptInvitationRequest,
    @CurrentUserId() userId: string,
    @ClientIp() ip: string,
  ): Promise<{ storeId: string }> {
    return this.accept.execute({ token: body.token, userId, ip });
  }
}
