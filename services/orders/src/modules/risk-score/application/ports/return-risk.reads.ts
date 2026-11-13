import type { ReturnRiskFacts } from '../../domain/return-risk.js';

/** Reads the facts the return-risk score needs, all from the caller's store. */
export interface ReturnRiskReads {
  /** null when the store has no such order. */
  factsFor(storeId: string, orderId: string): Promise<(ReturnRiskFacts & { id: string }) | null>;
}

export const RETURN_RISK_READS = Symbol('ReturnRiskReads');
