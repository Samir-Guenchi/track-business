import type { ListOrdersQuery } from '@trackecom/contracts';
import type { Prisma } from '../../../generated/prisma/client.js';

const PHONE_LIKE = /^[+\d][\d\s.-]{5,}$/;

/** `0555 12 34` and `+213 555 12 34` both search the stored `+213555 12 34...`. */
function phoneDigits(q: string): string {
  const digits = q.replace(/\D/g, '');
  return digits.replace(/^(00213|213|0)/, '');
}

function searchFilter(q: string): Prisma.OrderWhereInput {
  if (PHONE_LIKE.test(q)) {
    const digits = phoneDigits(q);
    return {
      OR: [
        { customerPhone: { contains: digits } },
        { customerPhone2: { contains: digits } },
        { trackingNumber: { contains: q.trim(), mode: 'insensitive' } },
      ],
    };
  }
  return { searchText: { contains: q.toLowerCase() } };
}

function createdFilter(query: ListOrdersQuery): Prisma.OrderWhereInput {
  if (!query.createdFrom && !query.createdTo) return {};
  return {
    createdAt: {
      ...(query.createdFrom ? { gte: new Date(query.createdFrom) } : {}),
      ...(query.createdTo ? { lt: new Date(query.createdTo) } : {}),
    },
  };
}

/** Translates the validated query string into a store-scoped Prisma filter. */
export function orderListFilter(storeId: string, query: ListOrdersQuery): Prisma.OrderWhereInput {
  return {
    storeId,
    deletedAt: null,
    ...(query.status ? { status: { in: query.status } } : {}),
    ...(query.wilayaCode ? { wilayaCode: query.wilayaCode } : {}),
    ...(query.source ? { source: query.source } : {}),
    ...(query.agentId ? { assignedAgentId: query.agentId } : {}),
    ...(query.carrier ? { carrier: query.carrier } : {}),
    ...(query.tag ? { tags: { has: query.tag } } : {}),
    ...createdFilter(query),
    ...(query.q ? searchFilter(query.q) : {}),
  };
}
