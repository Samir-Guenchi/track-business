import { Inject, Injectable } from '@nestjs/common';
import type { ExpectedFeesRequest, ExpectedFeesResponse } from '@trackecom/contracts';
import { expectedFees, type ParcelRoute, type RateRow } from '../domain/expected-fees.js';

export const CARRIER_FEE_READS = Symbol('CARRIER_FEE_READS');

export interface CarrierFeeReads {
  routes(storeId: string, request: ExpectedFeesRequest): Promise<ParcelRoute[]>;
  rateCard(storeId: string, carrier: string): Promise<RateRow[]>;
}

/** Expected carrier fees per parcel, for the payout fee audit in payments (#196). */
@Injectable()
export class CarrierFeesService {
  constructor(@Inject(CARRIER_FEE_READS) private readonly reads: CarrierFeeReads) {}

  async expected(storeId: string, request: ExpectedFeesRequest): Promise<ExpectedFeesResponse> {
    const [routes, card] = await Promise.all([
      this.reads.routes(storeId, request),
      this.reads.rateCard(storeId, request.carrier),
    ]);
    return { items: routes.map((route) => expectedFees(route, card)) };
  }
}
