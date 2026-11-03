/** Share of answered attempts the customer disputed, in whole percent; null without answers. */
export function disputeRate(row: { answered: number; disputed: number }): number | null {
  if (row.answered === 0) return null;
  return Math.round((100 * row.disputed) / row.answered);
}
