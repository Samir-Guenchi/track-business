import { Inject, Injectable } from '@nestjs/common';
import type { BestTimeQuery, BestTimeResponse } from '@trackecom/contracts';
import { type Clock, ORDERS_PORTS } from '../../orders/application/ports/orders.ports.js';
import { bestTime, hourlyRates } from '../domain/best-time.js';
import {
  CONFIRMATION_REPOSITORY,
  type ConfirmationRepository,
} from './ports/confirmation.repository.js';

const HISTORY_MS = 90 * 86_400_000;

/** The store's answer rate per calling hour (#54), overall or for one wilaya. */
@Injectable()
export class BestTimeService {
  constructor(
    @Inject(CONFIRMATION_REPOSITORY) private readonly repository: ConfirmationRepository,
    @Inject(ORDERS_PORTS.clock) private readonly now: Clock,
  ) {}

  async hours(storeId: string, query: BestTimeQuery): Promise<BestTimeResponse> {
    const now = this.now();
    const since = new Date(now.getTime() - HISTORY_MS);
    const scope = query.wilayaCode === undefined ? {} : { wilayaCode: query.wilayaCode };
    const rows = await this.repository.answerStats({ storeId, since, ...scope });
    const basis = query.wilayaCode === undefined ? 'store' : 'wilaya';
    return { hours: hourlyRates(rows), best: bestTime(rows, basis, now) };
  }
}
