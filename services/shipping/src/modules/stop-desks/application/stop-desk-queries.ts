import { Inject, Injectable } from '@nestjs/common';
import type { ListStopDesksQuery, StopDesk } from '@trackecom/contracts';
import { byDistance, distanceKm, type Point } from '../domain/distance.js';
import { STOP_DESKS_STORE, type DeskRow, type StopDesksStore } from './stop-desks.ports.js';

/** How many rows a point search reads before keeping the nearest `limit`. */
const POINT_SCAN = 500;

/** The public desk finder (#137): by wilaya, commune or a point, nearest first. */
@Injectable()
export class StopDeskQueries {
  constructor(@Inject(STOP_DESKS_STORE) private readonly store: StopDesksStore) {}

  async list(query: ListStopDesksQuery): Promise<StopDesk[]> {
    const near = pointOf(query);
    const rows = await this.store.find({
      wilayaCode: query.wilayaCode,
      communeId: query.communeId,
      carrier: query.carrier,
      near,
      limit: near ? POINT_SCAN : query.limit,
    });
    return rows
      .map((row) => withDistance(row, near))
      .sort(byDistance)
      .slice(0, query.limit);
  }
}

const pointOf = ({ lat, lng }: ListStopDesksQuery): Point | undefined =>
  lat === undefined || lng === undefined ? undefined : { lat, lng };

function withDistance(row: DeskRow, near: Point | undefined): StopDesk {
  const located = row.lat !== null && row.lng !== null;
  const distance =
    near && located ? distanceKm(near, { lat: row.lat ?? 0, lng: row.lng ?? 0 }) : null;
  return { ...row, distanceKm: distance };
}
