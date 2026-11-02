/** One past order, scored, and whether it came back. */
export interface ScoredOutcome {
  readonly score: number;
  readonly returned: boolean;
}

/**
 * Share of all returns caught in the riskiest `topShare` of orders (#50 acceptance: at least
 * 0.5 of returns in the top 0.2). Ties at the cut are taken in input order.
 */
export function returnsCapturedAtTop(outcomes: readonly ScoredOutcome[], topShare = 0.2): number {
  const returns = outcomes.filter((outcome) => outcome.returned).length;
  if (returns === 0) return 0;
  const top = [...outcomes]
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.ceil(outcomes.length * topShare));
  return top.filter((outcome) => outcome.returned).length / returns;
}

/** Precision and recall when every order scoring at least `threshold` raises an alert. */
export function alertQuality(
  outcomes: readonly ScoredOutcome[],
  threshold: number,
): { precision: number; recall: number } {
  const alerts = outcomes.filter((outcome) => outcome.score >= threshold);
  const caught = alerts.filter((outcome) => outcome.returned).length;
  const returns = outcomes.filter((outcome) => outcome.returned).length;
  return {
    precision: alerts.length === 0 ? 0 : caught / alerts.length,
    recall: returns === 0 ? 0 : caught / returns,
  };
}
