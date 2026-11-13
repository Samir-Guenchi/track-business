import type { TransitSample } from '../domain/eta.js';

export interface RouteQuery {
  readonly carrier: string;
  readonly wilayaCode: number;
  readonly since: Date;
}

/** Delivered parcels of one carrier to one wilaya, across stores (transit times only). */
export interface TransitSamples {
  forRoute(query: RouteQuery): Promise<TransitSample[]>;
}

export const TRANSIT_SAMPLES = Symbol('TransitSamples');
