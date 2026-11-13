import type { Point } from '../domain/distance.js';

export const STOP_DESKS_STORE = Symbol('STOP_DESKS_STORE');

/** A desk as stored, before the distance from the asked point is added. */
export interface DeskRow {
  readonly id: string;
  readonly carrier: string;
  readonly name: string;
  readonly address: string;
  readonly communeId: number;
  readonly wilayaCode: number;
  readonly communeNameFr: string;
  readonly communeNameAr: string;
  readonly lat: number | null;
  readonly lng: number | null;
  readonly hours: Record<string, string> | null;
  readonly phone: string | null;
}

export interface DeskFilter {
  readonly wilayaCode?: number | undefined;
  readonly communeId?: number | undefined;
  readonly carrier?: string | undefined;
  /** Narrows to a box around the point; exact distances are computed afterwards. */
  readonly near?: Point | undefined;
  readonly limit: number;
}

/** A desk from the carrier's list, matched to one of our communes. */
export interface SyncedDesk {
  readonly code: string;
  readonly name: string;
  readonly address: string;
  readonly communeId: number;
}

export interface StopDesksStore {
  find(filter: DeskFilter): Promise<DeskRow[]>;
  /** Upserts by (carrier, code); returns how many were saved. */
  saveSynced(carrier: string, desks: readonly SyncedDesk[]): Promise<number>;
}
