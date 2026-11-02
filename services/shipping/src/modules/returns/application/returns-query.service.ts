import { Inject, Injectable } from '@nestjs/common';
import type {
  ListExpectedReturnsQuery,
  ListExpectedReturnsResponse,
  ListReturnBatchesQuery,
  ListReturnBatchesResponse,
  ReturnBatch,
  ReturnSummaryResponse,
} from '@trackecom/contracts';
import { ReturnBatchNotFoundError } from '../domain/return.errors.js';
import { overdueCutoff } from '../domain/return-window.js';
import { type Clock, RETURNS_CLOCK, RETURNS_STORE, type ReturnsStore } from './returns.ports.js';

/** Reads of the return chain: what is still out, per carrier, and past hand-overs. */
@Injectable()
export class ReturnsQueryService {
  constructor(
    @Inject(RETURNS_STORE) private readonly store: ReturnsStore,
    @Inject(RETURNS_CLOCK) private readonly clock: Clock,
  ) {}

  expected(storeId: string, query: ListExpectedReturnsQuery): Promise<ListExpectedReturnsResponse> {
    return this.store.expected({ storeId, query, now: this.clock() });
  }

  async summary(storeId: string, overdueDays: number): Promise<ReturnSummaryResponse> {
    const cutoff = overdueCutoff(this.clock(), overdueDays);
    return { overdueDays, carriers: await this.store.countByCarrier(storeId, cutoff) };
  }

  batches(storeId: string, query: ListReturnBatchesQuery): Promise<ListReturnBatchesResponse> {
    return this.store.batches(storeId, query);
  }

  async batch(storeId: string, id: string): Promise<ReturnBatch> {
    const batch = await this.store.batch(storeId, id);
    if (!batch) throw new ReturnBatchNotFoundError('No return batch with this id');
    return batch;
  }
}
