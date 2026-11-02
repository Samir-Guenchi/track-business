import {
  type CreateDeliveryRequest,
  DELIVERY_REQUEST_LIMITS,
  type DeliveryRequestKind,
  type DeliveryType,
  type ParcelStatus,
} from '@trackecom/contracts';

/** Before the courier leaves, or after a failed attempt: later, the change cannot reach them. */
const OPEN_STATUSES: ReadonlySet<ParcelStatus> = new Set([
  'created',
  'picked_up',
  'in_transit',
  'failed_attempt',
]);

export interface ParcelFacts {
  readonly status: ParcelStatus;
  /** null for parcels created before #136: treated as home delivery. */
  readonly deliveryType: DeliveryType | null;
  readonly stopDeskNearby: boolean;
}

export function availableKinds(parcel: ParcelFacts): DeliveryRequestKind[] {
  if (!OPEN_STATUSES.has(parcel.status)) return [];
  const kinds: DeliveryRequestKind[] = ['reschedule', 'call_after'];
  if (parcel.deliveryType === 'stopdesk') return kinds;
  kinds.push('fix_address');
  if (parcel.stopDeskNearby) kinds.push('switch_stopdesk');
  return kinds;
}

const DAY_MS = 86_400_000;
/** Algeria keeps UTC+1 all year, with no daylight saving. */
const ALGIERS_OFFSET_MS = 3_600_000;
const algiersDay = (at: Date, plusDays: number) =>
  new Date(at.getTime() + ALGIERS_OFFSET_MS + plusDays * DAY_MS).toISOString().slice(0, 10);

/** Tomorrow to a week later, in Algiers calendar days. */
export function dateWindow(now: Date): { earliest: string; latest: string } {
  return {
    earliest: algiersDay(now, 1),
    latest: algiersDay(now, DELIVERY_REQUEST_LIMITS.maxDaysAhead),
  };
}

export type Refusal = 'closed' | 'not_offered' | 'bad_date' | 'too_many';

export interface RequestContext {
  readonly parcel: ParcelFacts;
  readonly now: Date;
  readonly usedToday: number;
}

/** Why this request cannot be taken, or null when it can. */
export function refusalOf(request: CreateDeliveryRequest, ctx: RequestContext): Refusal | null {
  const kinds = availableKinds(ctx.parcel);
  if (kinds.length === 0) return 'closed';
  if (!kinds.includes(request.kind)) return 'not_offered';
  if (ctx.usedToday >= DELIVERY_REQUEST_LIMITS.perDay) return 'too_many';
  if (request.kind !== 'reschedule') return null;
  const { earliest, latest } = dateWindow(ctx.now);
  return request.date < earliest || request.date > latest ? 'bad_date' : null;
}
