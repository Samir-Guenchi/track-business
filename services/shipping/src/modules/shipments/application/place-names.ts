import { Injectable } from '@nestjs/common';
import type { ShipRequestedEvent } from '@trackecom/contracts';
import { GeoCatalog } from '../../geo/application/geo-catalog.js';
import type { PlaceNames } from '../domain/ship-request.js';
import { UnknownPlaceError } from '../domain/shipment.errors.js';

/** French names from our geo data, which carriers like Yalidine use to identify places. */
@Injectable()
export class PlaceNamesResolver {
  constructor(private readonly geo: GeoCatalog) {}

  async resolve(request: ShipRequestedEvent): Promise<PlaceNames> {
    const [origin, wilaya, commune] = await Promise.all([
      this.geo.wilaya(request.originWilayaCode),
      this.geo.wilaya(request.wilayaCode),
      this.geo.commune(request.wilayaCode, request.communeId),
    ]);
    if (!origin || !wilaya || !commune) {
      throw new UnknownPlaceError(`Unknown place for ${request.reference}`);
    }
    return {
      originWilayaName: origin.nameFr,
      wilayaName: wilaya.nameFr,
      communeName: commune.nameFr,
    };
  }
}
