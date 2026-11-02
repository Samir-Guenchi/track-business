import {
  type FailedAttemptReason,
  FailedAttemptReasonSchema,
  type FollowupStatus,
  FollowupStatusSchema,
} from '@trackecom/contracts';

export interface FollowupFilters {
  readonly status: FollowupStatus;
  readonly reason?: FailedAttemptReason | undefined;
  readonly overdue: boolean;
}

const PAGE_SIZE = '50';

/** Reads the URL; anything unknown falls back to the open queue. */
export function filtersFromParams(params: URLSearchParams): FollowupFilters {
  const status = FollowupStatusSchema.safeParse(params.get('status'));
  const reason = FailedAttemptReasonSchema.safeParse(params.get('reason'));
  return {
    status: status.success ? status.data : 'open',
    reason: reason.success ? reason.data : undefined,
    overdue: params.get('overdue') === 'true',
  };
}

export function paramsFromFilters(filters: FollowupFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.status !== 'open') params.set('status', filters.status);
  if (filters.reason) params.set('reason', filters.reason);
  if (filters.overdue) params.set('overdue', 'true');
  return params;
}

/** The API query: "overdue" only makes sense for open items. */
export function listQueryOf(filters: FollowupFilters, cursor?: string): URLSearchParams {
  const query = new URLSearchParams({ status: filters.status, limit: PAGE_SIZE });
  if (filters.reason) query.set('reason', filters.reason);
  if (filters.overdue && filters.status === 'open') query.set('overdue', 'true');
  if (cursor) query.set('cursor', cursor);
  return query;
}

/** Overdue: still open after the courier's next run. */
export const isOverdue = (item: { status: FollowupStatus; dueAt: string }, now: Date): boolean =>
  item.status === 'open' && new Date(item.dueAt) < now;
