import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { ImportPayoutRequest } from '@trackecom/contracts';
import { DuplicatePayoutLineError } from '../domain/payout.errors.js';
import { duplicateTrackingNumbers, statementTotals } from '../domain/payout-statement.js';
import {
  PAYOUT_REPOSITORY,
  type PayoutRecord,
  type PayoutRepository,
} from './ports/payout.repository.js';

/**
 * `POST /payouts` (#42): stores one carrier statement for the matcher. Matching thousands of
 * lines never runs inside the request (ADR-0002); the statement is `processing` until it is done.
 */
@Injectable()
export class ImportPayoutUseCase {
  constructor(@Inject(PAYOUT_REPOSITORY) private readonly payouts: PayoutRepository) {}

  execute(storeId: string, request: ImportPayoutRequest): Promise<PayoutRecord> {
    const duplicates = duplicateTrackingNumbers(request.lines);
    if (duplicates.length > 0) throw new DuplicatePayoutLineError(duplicates);
    return this.payouts.create({
      id: randomUUID(),
      storeId,
      carrier: request.carrier,
      reference: request.reference,
      paidAt: new Date(`${request.paidAt}T00:00:00.000Z`),
      totalAmount: request.totalAmount,
      totals: statementTotals(request.lines),
      lines: request.lines,
    });
  }
}
