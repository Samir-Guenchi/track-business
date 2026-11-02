import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  type GeoSearchQuery,
  GeoSearchQuerySchema,
  type GeoSearchResponse,
  type ListCommunesResponse,
  type ListWilayasResponse,
  WilayaCodeSchema,
} from '@trackecom/contracts';
import { Public, ZodValidationPipe } from '@trackecom/service-kit';
import { GeoCatalog } from '../application/geo-catalog.js';

/** Public reference data; the gateway caches these responses (they change only with a reform). */
@Public()
@Controller('geo')
export class GeoController {
  constructor(private readonly catalog: GeoCatalog) {}

  @Get('wilayas')
  async wilayas(): Promise<ListWilayasResponse> {
    return { items: [...(await this.catalog.listWilayas())] };
  }

  @Get('wilayas/:code/communes')
  async communes(
    @Param('code', new ZodValidationPipe(WilayaCodeSchema)) code: number,
  ): Promise<ListCommunesResponse> {
    return { items: [...(await this.catalog.listCommunes(code))] };
  }

  @Get('search')
  async search(
    @Query(new ZodValidationPipe(GeoSearchQuerySchema)) query: GeoSearchQuery,
  ): Promise<GeoSearchResponse> {
    const options =
      query.wilayaCode === undefined
        ? { limit: query.limit }
        : { limit: query.limit, wilayaCode: query.wilayaCode };
    return { items: await this.catalog.search(query.q, options) };
  }
}
