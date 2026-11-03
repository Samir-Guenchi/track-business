import { Inject, Injectable } from '@nestjs/common';
import {
  type DecideReturnRequest,
  type ListReturnRequestsQuery,
  type ListReturnRequestsResponse,
  RETURN_REQUEST_EVENTS,
  type SellerReturnRequest,
} from '@trackecom/contracts';
import {
  ReturnRequestDecidedError,
  ReturnRequestNotFoundError,
  stateAfter,
} from '../domain/return-request.js';
import { requestMessage } from './return-request-events.js';
import {
  type Clock,
  RETURN_REQUESTS_CLOCK,
  RETURN_REQUESTS_STORE,
  type ReturnRequestsStore,
} from './return-requests.ports.js';

/** The seller's queue of return and exchange requests (#201): decide each once. */
@Injectable()
export class SellerReturnRequestsService {
  constructor(
    @Inject(RETURN_REQUESTS_STORE) private readonly store: ReturnRequestsStore,
    @Inject(RETURN_REQUESTS_CLOCK) private readonly now: Clock,
  ) {}

  async list(storeId: string, query: ListReturnRequestsQuery): Promise<ListReturnRequestsResponse> {
    return { items: await this.store.list(storeId, query) };
  }

  async decide(
    storeId: string,
    id: string,
    body: DecideReturnRequest,
  ): Promise<SellerReturnRequest> {
    const record = await this.store.byId(storeId, id);
    if (!record) throw new ReturnRequestNotFoundError('No such return request');
    if (record.state !== 'pending') throw new ReturnRequestDecidedError('Already decided');
    const now = this.now();
    const decided = {
      ...record,
      state: stateAfter(body),
      sellerMessage: body.message || null,
      newOrderId: body.decision === 'accept_exchange' ? body.newOrderId : null,
      decidedAt: now,
    };
    const message = requestMessage(RETURN_REQUEST_EVENTS.decided, decided, now);
    if (!(await this.store.decide(decided, [message]))) {
      throw new ReturnRequestDecidedError('Already decided');
    }
    const view = await this.store.sellerView(storeId, id);
    if (!view) throw new ReturnRequestNotFoundError('No such return request');
    return view;
  }
}
