import type { CarrierScore } from '@trackecom/contracts';

export interface WilayaGroup {
  readonly wilayaCode: number | null;
  readonly scores: readonly CarrierScore[];
}

/** The API sends wilaya lines already ranked; this keeps that order and groups them. */
export function groupByWilaya(scores: readonly CarrierScore[]): WilayaGroup[] {
  const groups: { wilayaCode: number | null; scores: CarrierScore[] }[] = [];
  for (const score of scores) {
    const last = groups.at(-1);
    if (last && last.wilayaCode === score.wilayaCode) last.scores.push(score);
    else groups.push({ wilayaCode: score.wilayaCode, scores: [score] });
  }
  return groups;
}

/** "83 %" with no decimals; a dash while no parcel is final. */
export function percent(rate: number | null, locale: string): string {
  if (rate === null) return '-';
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(rate);
}

/** Below this many final parcels a rate says little: the table marks it. */
export const FEW_PARCELS = 10;

export const isThin = (score: CarrierScore): boolean =>
  score.delivered + score.returned < FEW_PARCELS;
