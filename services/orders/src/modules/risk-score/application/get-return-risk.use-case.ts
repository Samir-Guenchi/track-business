import { Inject, Injectable } from '@nestjs/common';
import type { RiskScore } from '@trackecom/contracts';
import { OrderNotFoundError } from '../../orders/domain/order.errors.js';
import { describeReason } from '../domain/reason-text.js';
import { RISK_MODEL, scoreReturnRisk } from '../domain/return-risk.js';
import { RETURN_RISK_READS, type ReturnRiskReads } from './ports/return-risk.reads.js';

/** The return-risk score of one order (#50), computed on read so it uses the latest history. */
@Injectable()
export class GetReturnRiskUseCase {
  constructor(@Inject(RETURN_RISK_READS) private readonly reads: ReturnRiskReads) {}

  async execute(storeId: string, orderId: string): Promise<RiskScore> {
    const facts = await this.reads.factsFor(storeId, orderId);
    if (!facts) throw new OrderNotFoundError();
    const risk = scoreReturnRisk(facts);
    return {
      orderId: facts.id,
      score: risk.score,
      level: risk.level,
      reasons: risk.reasons.map(describeReason),
      model: RISK_MODEL,
    };
  }
}
