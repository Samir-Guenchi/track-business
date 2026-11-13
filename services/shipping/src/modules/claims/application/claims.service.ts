import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type {
  Claim,
  ClaimLetter,
  ClaimLetterQuery,
  CreateClaimRequest,
  UpdateClaimRequest,
} from '@trackecom/contracts';
import type { StoreContext } from '@trackecom/service-kit';
import { claimLetter } from '../domain/claim-letter.js';
import { openingRefusal, stampsFor, transitionRefusal } from '../domain/claim-rules.js';
import { ClaimExistsError, ClaimNotFoundError, ClaimRefusedError } from '../domain/claim.errors.js';
import { CLAIMS_CLOCK, CLAIMS_STORE, type ClaimsStore, type Clock } from './claims.ports.js';

/** Claims against carriers (#139): open one per parcel, follow it, print the letter. */
@Injectable()
export class ClaimsService {
  constructor(
    @Inject(CLAIMS_STORE) private readonly store: ClaimsStore,
    @Inject(CLAIMS_CLOCK) private readonly now: Clock,
  ) {}

  async open(ctx: StoreContext, request: CreateClaimRequest): Promise<Claim> {
    const parcel = await this.store.parcel(ctx.storeId, request.shipmentId);
    if (!parcel) throw new ClaimNotFoundError('No parcel of this store has this id');
    const refusal = openingRefusal(parcel.status);
    if (refusal) throw new ClaimRefusedError(refusal);
    const claim = await this.store.create({
      id: randomUUID(),
      storeId: ctx.storeId,
      shipmentId: parcel.id,
      reason: request.reason,
      declaredValue: request.declaredValue,
      note: request.note ?? null,
      createdBy: ctx.userId,
      createdAt: this.now(),
    });
    if (!claim) throw new ClaimExistsError('This parcel already has a claim');
    return claim;
  }

  async update(ctx: StoreContext, id: string, request: UpdateClaimRequest): Promise<Claim> {
    const current = await this.claim(ctx.storeId, id);
    const refusal = transitionRefusal({
      from: current.state,
      to: request.state,
      recovered: request.recovered,
    });
    if (refusal) throw new ClaimRefusedError(refusal);
    const updated = await this.store.update(
      { storeId: ctx.storeId, id, from: current.state },
      {
        state: request.state,
        ...(request.recovered === undefined ? {} : { recovered: request.recovered }),
        ...(request.note === undefined ? {} : { note: request.note }),
        ...stampsFor(request.state, this.now()),
      },
    );
    if (!updated) throw new ClaimRefusedError('bad_transition');
    return updated;
  }

  async letter(storeId: string, id: string, { lang }: ClaimLetterQuery): Promise<ClaimLetter> {
    const claim = await this.claim(storeId, id);
    const parcel = await this.store.parcel(storeId, claim.shipmentId);
    if (!parcel) throw new ClaimNotFoundError('The parcel of this claim is gone');
    return claimLetter({
      lang,
      reason: claim.reason,
      carrier: parcel.carrier,
      trackingNumber: parcel.trackingNumber,
      reference: parcel.reference,
      shippedAt: parcel.createdAt,
      declaredValue: claim.declaredValue,
      note: claim.note,
      events: await this.store.timeline(parcel.id),
    });
  }

  private async claim(storeId: string, id: string): Promise<Claim> {
    const claim = await this.store.find(storeId, id);
    if (!claim) throw new ClaimNotFoundError('No claim of this store has this id');
    return claim;
  }
}
