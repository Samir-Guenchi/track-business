import { Inject, Injectable } from '@nestjs/common';
import type { ScorecardQuery, ScorecardResponse } from '@trackecom/contracts';
import {
  byDeliveryRate,
  byWilayaThenRate,
  type ScoreRow,
  storeWide,
  toScore,
} from '../domain/scorecard.js';

export const SCORE_ROWS = Symbol('SCORE_ROWS');
export interface ScoreRows {
  rows(storeId: string, days: number): Promise<ScoreRow[]>;
}

/** How each carrier did for this store, overall and per wilaya (#139). */
@Injectable()
export class ScorecardService {
  constructor(@Inject(SCORE_ROWS) private readonly source: ScoreRows) {}

  async scorecard(storeId: string, { days }: ScorecardQuery): Promise<ScorecardResponse> {
    const rows = await this.source.rows(storeId, days);
    return {
      days,
      carriers: storeWide(rows).map(toScore).sort(byDeliveryRate),
      byWilaya: rows.map(toScore).sort(byWilayaThenRate),
    };
  }
}
