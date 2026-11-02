import { Inject, Injectable } from '@nestjs/common';
import type {
  ListClaimCandidatesQuery,
  ListClaimCandidatesResponse,
  ListClaimsQuery,
  ListClaimsResponse,
} from '@trackecom/contracts';
import { CLAIMS_CLOCK, CLAIMS_STORE, type ClaimsStore, type Clock } from './claims.ports.js';

@Injectable()
export class ClaimsQueryService {
  constructor(
    @Inject(CLAIMS_STORE) private readonly store: ClaimsStore,
    @Inject(CLAIMS_CLOCK) private readonly now: Clock,
  ) {}

  async candidates(
    storeId: string,
    query: ListClaimCandidatesQuery,
  ): Promise<ListClaimCandidatesResponse> {
    return { items: await this.store.candidates(storeId, query, this.now()) };
  }

  async list(storeId: string, query: ListClaimsQuery): Promise<ListClaimsResponse> {
    return { items: await this.store.list(storeId, query) };
  }
}
