import { Inject, Injectable } from '@nestjs/common';
import type { ShipRequestedEvent } from '@trackecom/contracts';
import { GeoCatalog } from '../../geo/application/geo-catalog.js';
import type { PlaceNames } from '../domain/ship-request.js';
import { UnknownPlaceError } from '../domain/shipment.errors.js';
import { SHIPMENT_REPOSITORY, type ShipmentRepository } from './ports/shipment.repository.js';

/**
 * French names from our geo data, which carriers like Yalidine use to identify places, and the
 * carrier's code for the chosen stop-desk.
 */
@Injectable()
export class PlaceNamesResolver {
  constructor(
    private readonly geo: GeoCatalog,
    @Inject(SHIPMENT_REPOSITORY) private readonly shipments: ShipmentRepository,
  ) {}

  async resolve(request: ShipRequestedEvent): Promise<PlaceNames> {
    const [origin, wilaya, commune, stopDeskCode] = await Promise.all([
      this.geo.wilaya(request.originWilayaCode),
      this.geo.wilaya(request.wilayaCode),
      this.geo.commune(request.wilayaCode, request.communeId),
      this.deskCode(request),
    ]);
    if (!origin || !wilaya || !commune) {
      throw new UnknownPlaceError(`Unknown place for ${request.reference}`);
    }
    return {
      originWilayaName: origin.nameFr,
      wilayaName: wilaya.nameFr,
      communeName: commune.nameFr,
      stopDeskCode,
    };
  }

  private async deskCode({ deliveryType, stopDeskId, carrier }: ShipRequestedEvent) {
    if (deliveryType !== 'stopdesk' || !stopDeskId) return null;
    return this.shipments.stopDeskCode(carrier, stopDeskId);
  }
}
