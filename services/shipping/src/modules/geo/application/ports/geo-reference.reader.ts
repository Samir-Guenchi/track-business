import type { Wilaya } from '@trackecom/contracts';
import type { SearchableCommune } from '../../domain/commune-search-index.js';

/** Current (non-retired) reference data, as stored by the shipping service. */
export interface GeoReferenceReader {
  listWilayas(): Promise<Wilaya[]>;
  listCommunes(): Promise<SearchableCommune[]>;
}

export const GEO_REFERENCE_READER = Symbol('GEO_REFERENCE_READER');
