import { Inject, Injectable } from '@nestjs/common';
import type { FeeAudit, PayoutLineInput } from '@trackecom/contracts';
import { PayoutNotFoundError } from '../../money/domain/payout.errors.js';
import { type ExpectedFee, auditFees } from '../domain/fee-audit.js';

export const PAYOUT_LINES = Symbol('PAYOUT_LINES');
export const EXPECTED_FEES = Symbol('EXPECTED_FEES');

export interface PayoutLines {
  find(
    storeId: string,
    payoutId: string,
  ): Promise<{ carrier: string; lines: PayoutLineInput[] } | null>;
}

/** The carrier's rate card per parcel, from shipping; null when it cannot be asked. */
export interface ExpectedFeesSource {
  forParcels(query: {
    storeId: string;
    carrier: string;
    trackingNumbers: string[];
  }): Promise<ExpectedFee[] | null>;
}

/** `GET /payouts/:id/fee-audit` (#196): computed on demand, nothing stored. */
@Injectable()
export class FeeAuditUseCase {
  constructor(
    @Inject(PAYOUT_LINES) private readonly payouts: PayoutLines,
    @Inject(EXPECTED_FEES) private readonly rates: ExpectedFeesSource,
  ) {}

  async execute(storeId: string, payoutId: string): Promise<FeeAudit> {
    const payout = await this.payouts.find(storeId, payoutId);
    if (!payout) throw new PayoutNotFoundError();
    const trackingNumbers = [...new Set(payout.lines.map((line) => line.trackingNumber))];
    const expected = await this.rates.forParcels({
      storeId,
      carrier: payout.carrier,
      trackingNumbers,
    });
    const byNumber = expected && new Map(expected.map((fee) => [fee.trackingNumber, fee]));
    const result = auditFees(payout.lines, byNumber);
    return {
      payoutId,
      carrier: payout.carrier,
      lines: payout.lines.length,
      ...result,
      rateCardChecked: expected !== null,
    };
  }
}
