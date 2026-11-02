import type {
  CarrierOption,
  CarrierSuggestion,
  DeliveryType,
  SuggestionReason,
  SuggestionSettings,
} from '@trackecom/contracts';
import { type CarrierFacts, reliability, relativeToBest, storeRate } from './carrier-facts.js';

export interface SuggestionInput {
  readonly wilayaCode: number;
  readonly deliveryType: DeliveryType;
  readonly settings: SuggestionSettings;
}

interface Scored {
  readonly facts: CarrierFacts;
  readonly cost: number;
  readonly reliability: number;
  readonly score: number;
}

const unavailableReason = (facts: CarrierFacts, deliveryType: DeliveryType) => {
  if (facts.cost === null) return 'no_rate' as const;
  if (deliveryType === 'stopdesk' && facts.stopDesk === false) return 'no_stopdesk' as const;
  return null;
};

const round = (value: number) => Math.round(value * 10) / 10;

function score(available: readonly CarrierFacts[], settings: SuggestionSettings): Scored[] {
  const { price, reliability: reliable, speed } = settings.weights;
  const cheapest = Math.min(...available.map((facts) => facts.cost ?? 0));
  const fastest = Math.min(...available.map((facts) => facts.averageDays ?? Infinity));
  return available.map((facts) => {
    const cost = facts.cost ?? 0;
    const rate = reliability(facts);
    const quick = facts.averageDays === null ? 0.5 : relativeToBest(facts.averageDays, fastest);
    const total = price * relativeToBest(cost, cheapest) + reliable * rate + speed * quick;
    return {
      facts,
      cost,
      reliability: rate,
      score: round((100 * total) / (price + reliable + speed)),
    };
  });
}

/** True when `best` alone has the lowest (or highest) value of `pick` among the options. */
function uniquely(best: Scored, all: readonly Scored[], pick: (s: Scored) => number | null) {
  const mine = pick(best);
  return mine !== null && all.every((other) => other === best || (pick(other) ?? Infinity) > mine);
}

function reasonFor(best: Scored, all: readonly Scored[]): SuggestionReason {
  if (all.length === 1) return 'only_option';
  if (uniquely(best, all, (s) => s.cost)) return 'cheapest';
  if (uniquely(best, all, (s) => -s.reliability)) return 'most_reliable';
  if (uniquely(best, all, (s) => s.facts.averageDays)) return 'fastest';
  return 'best_balance';
}

const toOption = (facts: CarrierFacts, extra: Pick<CarrierOption, 'score' | 'unavailable'>) => ({
  carrier: facts.carrier,
  cost: facts.cost,
  storeDeliveryRate: storeRate(facts),
  storeParcels: facts.store.delivered + facts.store.returned,
  networkDeliveryRate: facts.networkRate,
  averageDeliveryDays: facts.averageDays === null ? null : round(facts.averageDays),
  ...extra,
});

/**
 * Picks a carrier for one parcel (#41): a matching routing rule wins, otherwise the best score
 * with the store's weights. Pure; the caller gathers the facts.
 */
export function suggestCarrier(
  facts: readonly CarrierFacts[],
  input: SuggestionInput,
): CarrierSuggestion {
  const blocked = facts.filter((each) => unavailableReason(each, input.deliveryType) !== null);
  const ranked = score(
    facts.filter((each) => !blocked.includes(each)),
    input.settings,
  ).sort((a, b) => b.score - a.score);
  const options = [
    ...ranked.map((s) => toOption(s.facts, { score: s.score, unavailable: null })),
    ...blocked.map((each) =>
      toOption(each, { score: null, unavailable: unavailableReason(each, input.deliveryType) }),
    ),
  ];
  const rule = input.settings.rules.find((r) => r.wilayaCodes.includes(input.wilayaCode));
  const routed = rule && ranked.find((s) => s.facts.carrier === rule.carrier);
  if (routed) return { suggested: routed.facts.carrier, reason: 'routing_rule', options };
  const [best] = ranked;
  if (!best) return { suggested: null, reason: null, options };
  return { suggested: best.facts.carrier, reason: reasonFor(best, ranked), options };
}
