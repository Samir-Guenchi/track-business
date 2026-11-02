import { Inject, Injectable } from '@nestjs/common';
import type {
  DeliveryRequest,
  ListDeliveryRequestsQuery,
  ListDeliveryRequestsResponse,
  UpdateDeliveryRequest,
} from '@trackecom/contracts';
import type { StoreContext } from '@trackecom/service-kit';
import { DeliveryRequestNotFoundError } from '../domain/delivery-request.errors.js';
import {
  type Clock,
  DELIVERY_REQUESTS_CLOCK,
  DELIVERY_REQUESTS_STORE,
  type DeliveryRequestsStore,
} from './delivery-requests.ports.js';

/** The seller's daily change list (#136): what customers asked, to pass on to each carrier. */
@Injectable()
export class SellerDeliveryRequestsService {
  constructor(
    @Inject(DELIVERY_REQUESTS_STORE) private readonly store: DeliveryRequestsStore,
    @Inject(DELIVERY_REQUESTS_CLOCK) private readonly now: Clock,
  ) {}

  async list(
    storeId: string,
    query: ListDeliveryRequestsQuery,
  ): Promise<ListDeliveryRequestsResponse> {
    return { items: await this.store.list(storeId, query) };
  }

  async update(
    store: StoreContext,
    id: string,
    change: UpdateDeliveryRequest,
  ): Promise<DeliveryRequest> {
    const updated = await this.store.setState({
      storeId: store.storeId,
      id,
      state: change.state,
      userId: store.userId,
      at: this.now(),
    });
    if (!updated) throw new DeliveryRequestNotFoundError('No pending request with this id');
    return updated;
  }
}
