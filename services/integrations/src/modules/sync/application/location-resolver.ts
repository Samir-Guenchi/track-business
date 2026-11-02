import { Inject, Injectable } from '@nestjs/common';
import type { ExternalCustomer } from '@trackecom/connectors';
import { matchCommune, matchWilaya } from '../domain/address-match.js';
import type { Location } from '../domain/received-order.js';
import { type GeoReference, SYNC_PORTS } from './ports/sync.ports.js';

/** Places a shop's free-text province and city on our wilaya and commune codes. */
@Injectable()
export class LocationResolver {
  constructor(@Inject(SYNC_PORTS.geo) private readonly geo: GeoReference) {}

  async resolve(customer: ExternalCustomer): Promise<Location | null> {
    const wilayaCode = matchWilaya(customer.province, await this.geo.wilayas());
    if (wilayaCode === null) return null;
    const communes = await this.geo.communes(wilayaCode);
    const communeId =
      matchCommune(customer.city, communes) ?? matchCommune(customer.address, communes);
    return communeId === null ? null : { wilayaCode, communeId };
  }
}
