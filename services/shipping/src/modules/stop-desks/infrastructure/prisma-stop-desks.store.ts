import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type {
  DeskFilter,
  DeskRow,
  StopDesksStore,
  SyncedDesk,
} from '../application/stop-desks.ports.js';
import { searchBox } from '../domain/distance.js';

const WITH_COMMUNE = { commune: { select: { wilayaCode: true, nameFr: true, nameAr: true } } };
type Row = Prisma.StopDeskGetPayload<{ include: typeof WITH_COMMUNE }>;

function whereOf(filter: DeskFilter): Prisma.StopDeskWhereInput {
  const box = filter.near && searchBox(filter.near);
  return {
    isActive: true,
    ...(filter.carrier ? { carrier: filter.carrier } : {}),
    ...(filter.communeId ? { communeId: filter.communeId } : {}),
    ...(filter.wilayaCode ? { commune: { wilayaCode: filter.wilayaCode } } : {}),
    ...(box ? { latitude: box.lat, longitude: box.lng } : {}),
  };
}

const isHours = (value: unknown): value is Record<string, string> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every((each) => typeof each === 'string');

const toRow = (row: Row): DeskRow => ({
  id: row.id,
  carrier: row.carrier,
  name: row.name,
  address: row.address,
  communeId: row.communeId,
  wilayaCode: row.commune.wilayaCode,
  communeNameFr: row.commune.nameFr,
  communeNameAr: row.commune.nameAr,
  lat: row.latitude === null ? null : Number(row.latitude),
  lng: row.longitude === null ? null : Number(row.longitude),
  hours: isHours(row.hours) ? row.hours : null,
  phone: row.phone,
});

@Injectable()
export class PrismaStopDesksStore implements StopDesksStore {
  constructor(private readonly prisma: PrismaService) {}

  async find(filter: DeskFilter): Promise<DeskRow[]> {
    const rows = await this.prisma.stopDesk.findMany({
      where: whereOf(filter),
      include: WITH_COMMUNE,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      take: filter.limit,
    });
    return rows.map(toRow);
  }

  async saveSynced(carrier: string, desks: readonly SyncedDesk[]): Promise<number> {
    await this.prisma.$transaction(
      desks.map(({ code, ...desk }) =>
        this.prisma.stopDesk.upsert({
          where: { carrier_code: { carrier, code } },
          create: { id: randomUUID(), carrier, code, ...desk },
          update: { ...desk, isActive: true },
        }),
      ),
    );
    return desks.length;
  }
}
