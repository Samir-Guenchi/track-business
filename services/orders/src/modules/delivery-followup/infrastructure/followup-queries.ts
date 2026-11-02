import type { ListFollowupsQuery } from '@trackecom/contracts';
import type { Prisma } from '../../../generated/prisma/client.js';
import type { FollowupRecord } from '../domain/followup.js';

type Where = Prisma.DeliveryFollowupWhereInput;

/** Filters picked one by one: the query object is never spread into Prisma. */
export function listWhere(storeId: string, query: ListFollowupsQuery, now: Date): Where {
  return {
    storeId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.reason ? { reason: query.reason } : {}),
    ...(query.wilayaCode ? { wilayaCode: query.wilayaCode } : {}),
    ...(query.carrier ? { carrier: query.carrier } : {}),
    ...(query.overdue ? { status: 'open', dueAt: { lt: now } } : {}),
  };
}

/** Keyset cursor on (dueAt, id), the list order. */
export function encodeCursor(record: FollowupRecord): string {
  return Buffer.from(`${record.dueAt.toISOString()}|${record.id}`).toString('base64url');
}

export function decodeCursor(cursor: string | undefined): Where {
  if (!cursor) return {};
  const [dueAt, id] = Buffer.from(cursor, 'base64url').toString().split('|');
  const date = new Date(dueAt ?? '');
  if (!id || Number.isNaN(date.getTime())) return {};
  return { OR: [{ dueAt: { gt: date } }, { dueAt: date, id: { gt: id } }] };
}
