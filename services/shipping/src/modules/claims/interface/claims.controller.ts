import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  type Claim,
  type ClaimLetter,
  type ClaimLetterQuery,
  ClaimLetterQuerySchema,
  type CreateClaimRequest,
  CreateClaimRequestSchema,
  type ListClaimCandidatesQuery,
  ListClaimCandidatesQuerySchema,
  type ListClaimCandidatesResponse,
  type ListClaimsQuery,
  ListClaimsQuerySchema,
  type ListClaimsResponse,
  type UpdateClaimRequest,
  UpdateClaimRequestSchema,
} from '@trackecom/contracts';
import {
  CurrentStore,
  RequirePermission,
  type StoreContext,
  ZodValidationPipe,
} from '@trackecom/service-kit';
import { z } from 'zod';
import { ClaimsQueryService } from '../application/claims-query.service.js';
import { ClaimsService } from '../application/claims.service.js';

const Id = new ZodValidationPipe(z.uuid());

/** Claims against carriers (#139): what looks claimable, the claims, their letters. */
@Controller('claims')
export class ClaimsController {
  constructor(
    private readonly claims: ClaimsService,
    private readonly queries: ClaimsQueryService,
  ) {}

  @Get('candidates')
  @RequirePermission('orders.read')
  candidates(
    @Query(new ZodValidationPipe(ListClaimCandidatesQuerySchema)) query: ListClaimCandidatesQuery,
    @CurrentStore() store: StoreContext,
  ): Promise<ListClaimCandidatesResponse> {
    return this.queries.candidates(store.storeId, query);
  }

  @Get()
  @RequirePermission('orders.read')
  list(
    @Query(new ZodValidationPipe(ListClaimsQuerySchema)) query: ListClaimsQuery,
    @CurrentStore() store: StoreContext,
  ): Promise<ListClaimsResponse> {
    return this.queries.list(store.storeId, query);
  }

  @Post()
  @RequirePermission('shipments.manage')
  open(
    @Body(new ZodValidationPipe(CreateClaimRequestSchema)) body: CreateClaimRequest,
    @CurrentStore() store: StoreContext,
  ): Promise<Claim> {
    return this.claims.open(store, body);
  }

  @Patch(':id')
  @RequirePermission('shipments.manage')
  update(
    @Param('id', Id) id: string,
    @Body(new ZodValidationPipe(UpdateClaimRequestSchema)) body: UpdateClaimRequest,
    @CurrentStore() store: StoreContext,
  ): Promise<Claim> {
    return this.claims.update(store, id, body);
  }

  @Get(':id/letter')
  @RequirePermission('orders.read')
  letter(
    @Param('id', Id) id: string,
    @Query(new ZodValidationPipe(ClaimLetterQuerySchema)) query: ClaimLetterQuery,
    @CurrentStore() store: StoreContext,
  ): Promise<ClaimLetter> {
    return this.claims.letter(store.storeId, id, query);
  }
}
