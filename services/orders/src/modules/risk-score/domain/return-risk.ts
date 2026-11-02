import type { RiskFlag, RiskLevel, RiskReasonCode } from '@trackecom/contracts';

export const RISK_MODEL = 'rules-v1';

/** What the score is computed from; every count is for the order's own store. */
export interface ReturnRiskFacts {
  /** This phone's earlier finished orders at the store (the order itself excluded). */
  readonly customer: { readonly returned: number; readonly delivered: number };
  /** The store's finished orders to this wilaya over the last months. */
  readonly wilaya: { readonly finished: number; readonly returned: number };
  readonly codAmount: number;
  readonly createdAt: Date;
  readonly unreachedCalls: number;
  readonly riskFlags: readonly RiskFlag[];
  readonly possibleDuplicate: boolean;
}

export interface ScoredReason {
  readonly code: RiskReasonCode;
  readonly points: number;
  readonly params: Readonly<Record<string, string | number>>;
}

export interface ReturnRisk {
  readonly score: number;
  readonly level: RiskLevel;
  /** The three reasons that weigh most, heaviest first. */
  readonly reasons: readonly ScoredReason[];
}

/** Wilaya rates are only trusted from this many finished orders; below it, noise. */
export const MIN_WILAYA_SAMPLE = 20;
/** A typical national return rate; only the part of a wilaya's rate above it adds points. */
const BASE_RETURN_RATE = 0.2;
const FLAG_POINTS: Readonly<Partial<Record<RiskFlag, number>>> = {
  blacklisted: 40,
  suspicious_phone: 20,
  gibberish_name: 15,
  impossible_address: 15,
  order_burst: 10,
};

const reason = (code: RiskReasonCode, points: number, params = {}): ScoredReason => ({
  code,
  points,
  params,
});

function customerReasons({ customer }: ReturnRiskFacts): ScoredReason[] {
  const reasons: ScoredReason[] = [];
  if (customer.returned > 0) {
    const points = Math.min(30 * customer.returned, 45);
    reasons.push(reason('customer_returned_before', points, { count: customer.returned }));
  }
  if (customer.delivered > 0) {
    const points = -Math.min(10 * customer.delivered, 25);
    reasons.push(reason('customer_delivered_before', points, { count: customer.delivered }));
  }
  return reasons;
}

function wilayaReason({ wilaya }: ReturnRiskFacts): ScoredReason[] {
  if (wilaya.finished < MIN_WILAYA_SAMPLE) return [];
  const rate = wilaya.returned / wilaya.finished;
  const points = Math.min(Math.round((rate - BASE_RETURN_RATE) * 100), 25);
  return points > 0 ? [reason('wilaya_return_rate', points, { rate: round2(rate) })] : [];
}

function orderReasons(facts: ReturnRiskFacts): ScoredReason[] {
  const reasons: ScoredReason[] = [];
  if (facts.codAmount >= 15_000) {
    const points = facts.codAmount >= 30_000 ? 15 : 10;
    reasons.push(reason('high_value', points, { amount: facts.codAmount }));
  }
  if (algiersHour(facts.createdAt) < 6) reasons.push(reason('night_order', 5));
  if (facts.unreachedCalls >= 2) {
    const points = Math.min(5 * facts.unreachedCalls, 20);
    reasons.push(reason('hard_to_reach', points, { count: facts.unreachedCalls }));
  }
  if (facts.possibleDuplicate) reasons.push(reason('possible_duplicate', 10));
  return reasons;
}

function flagReasons({ riskFlags }: ReturnRiskFacts): ScoredReason[] {
  const reasons = riskFlags.flatMap((flag) => {
    const points = FLAG_POINTS[flag];
    return points ? [reason('fake_order_signal', points, { flag })] : [];
  });
  if (riskFlags.includes('network_refusals')) reasons.push(reason('network_refusals', 25));
  return reasons;
}

/** Rules-based return-risk score v1 (#50): additive points, clamped to 0..100. */
export function scoreReturnRisk(facts: ReturnRiskFacts): ReturnRisk {
  const all = [
    ...customerReasons(facts),
    ...wilayaReason(facts),
    ...orderReasons(facts),
    ...flagReasons(facts),
  ];
  const total = all.reduce((sum, item) => sum + item.points, 0);
  const score = Math.max(0, Math.min(100, total));
  const reasons = [...all].sort((a, b) => Math.abs(b.points) - Math.abs(a.points)).slice(0, 3);
  return { score, level: levelOf(score), reasons };
}

export const levelOf = (score: number): RiskLevel =>
  score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';

const round2 = (value: number): number => Math.round(value * 100) / 100;

/** Algeria is UTC+1 all year (no daylight saving). */
const algiersHour = (at: Date): number => (at.getUTCHours() + 1) % 24;
