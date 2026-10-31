import { Module } from '@nestjs/common';
import { CLOCK, GeoCatalog } from './application/geo-catalog.js';
import { GEO_REFERENCE_READER } from './application/ports/geo-reference.reader.js';
import { PrismaGeoReferenceReader } from './infrastructure/prisma-geo-reference.reader.js';
import { GeoController } from './interface/geo.controller.js';

@Module({
  controllers: [GeoController],
  providers: [
    GeoCatalog,
    { provide: GEO_REFERENCE_READER, useClass: PrismaGeoReferenceReader },
    { provide: CLOCK, useValue: () => Date.now() },
  ],
  exports: [GeoCatalog],
})
export class GeoModule {}
