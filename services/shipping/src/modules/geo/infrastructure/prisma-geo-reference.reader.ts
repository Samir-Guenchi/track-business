import { Injectable } from '@nestjs/common';
import type { Wilaya } from '@trackecom/contracts';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { GeoReferenceReader } from '../application/ports/geo-reference.reader.js';
import type { SearchableCommune } from '../domain/commune-search-index.js';

@Injectable()
export class PrismaGeoReferenceReader implements GeoReferenceReader {
  constructor(private readonly prisma: PrismaService) {}

  listWilayas(): Promise<Wilaya[]> {
    return this.prisma.wilaya.findMany({
      where: { retiredIn: null },
      select: { code: true, nameAr: true, nameFr: true },
      orderBy: { code: 'asc' },
    });
  }

  async listCommunes(): Promise<SearchableCommune[]> {
    const rows = await this.prisma.commune.findMany({
      where: { retiredIn: null },
      orderBy: [{ wilayaCode: 'asc' }, { nameFr: 'asc' }],
      select: {
        id: true,
        wilayaCode: true,
        nameAr: true,
        nameFr: true,
        postalCode: true,
        aliases: true,
        _count: { select: { stopDesks: { where: { isActive: true } } } },
      },
    });
    return rows.map(({ _count, ...row }) => ({ ...row, hasStopDesk: _count.stopDesks > 0 }));
  }
}
