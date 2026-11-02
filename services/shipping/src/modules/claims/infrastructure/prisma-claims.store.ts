import { Injectable } from '@nestjs/common';
import type { Claim, ListClaimCandidatesQuery, ListClaimsQuery } from '@trackecom/contracts';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { ClaimChange, ClaimsStore, NewClaim } from '../application/claims.ports.js';
import type { LetterEvent } from '../domain/claim-letter.js';
import { claimCandidates } from './claim-candidates.js';
import { PARCEL_FIELDS, toClaim, toParcel, WITH_SHIPMENT } from './claim-rows.js';

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
/** The letter quotes the latest events; a carrier does not read fifty lines. */
const TIMELINE_LIMIT = 15;

@Injectable()
export class PrismaClaimsStore implements ClaimsStore {
  constructor(private readonly prisma: PrismaService) {}

  candidates(storeId: string, query: ListClaimCandidatesQuery, now: Date) {
    return claimCandidates(this.prisma, storeId, { query, now });
  }

  async parcel(storeId: string, shipmentId: string) {
    const row = await this.prisma.shipment.findFirst({
      where: { id: shipmentId, storeId },
      select: PARCEL_FIELDS,
    });
    return row ? toParcel(row) : null;
  }

  async create(claim: NewClaim): Promise<Claim | null> {
    try {
      return toClaim(await this.prisma.claim.create({ data: claim, include: WITH_SHIPMENT }));
    } catch (error) {
      if (isUniqueViolation(error)) return null;
      throw error;
    }
  }

  async list(storeId: string, query: ListClaimsQuery): Promise<Claim[]> {
    const rows = await this.prisma.claim.findMany({
      where: {
        storeId,
        ...(query.state ? { state: query.state } : {}),
        ...(query.carrier ? { shipment: { carrier: query.carrier } } : {}),
      },
      include: WITH_SHIPMENT,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit,
    });
    return rows.map(toClaim);
  }

  async find(storeId: string, id: string): Promise<Claim | null> {
    const row = await this.prisma.claim.findFirst({
      where: { id, storeId },
      include: WITH_SHIPMENT,
    });
    return row ? toClaim(row) : null;
  }

  async update(ref: { storeId: string; id: string; from: string }, change: ClaimChange) {
    const { count } = await this.prisma.claim.updateMany({
      where: { id: ref.id, storeId: ref.storeId, state: ref.from },
      data: change,
    });
    return count === 1 ? this.find(ref.storeId, ref.id) : null;
  }

  async timeline(shipmentId: string): Promise<LetterEvent[]> {
    const rows = await this.prisma.trackingEvent.findMany({
      where: { shipmentId },
      orderBy: { at: 'desc' },
      take: TIMELINE_LIMIT,
      select: { at: true, carrierStatus: true, location: true },
    });
    return rows
      .reverse()
      .map((row) => ({ at: row.at, label: row.carrierStatus, location: row.location }));
  }
}
