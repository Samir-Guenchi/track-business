import { type CallOutcome, canTransition, type OrderStatus } from '@trackecom/contracts';

/** Statuses an agent still has to call about; the queue only offers these. */
export const CALLABLE_STATUSES: readonly OrderStatus[] = ['new', 'to_confirm', 'postponed'];

export interface CallPlanInput {
  readonly status: OrderStatus;
  readonly outcome: CallOutcome;
  readonly unreachedCalls: number;
  readonly unreachableAfter: number;
  readonly callBackAt: Date | null;
}

/** What a call changes on the order. `status` equal to the current one means no status change. */
export interface CallPlan {
  readonly status: OrderStatus;
  readonly nextCallAt: Date | null;
  readonly unreachedCalls: number;
}

function targetStatus(input: CallPlanInput, unreachedCalls: number): OrderStatus {
  switch (input.outcome) {
    case 'confirmed':
    case 'cancelled':
      return input.outcome;
    case 'postponed':
      return 'postponed';
    case 'wrong_number':
      return 'unreachable';
    case 'no_answer':
    case 'busy':
      return unreachedCalls >= input.unreachableAfter ? 'unreachable' : 'to_confirm';
    case 'call_back':
      return 'to_confirm';
  }
}

/** The first call puts a `new` order into confirmation, so `new` may go wherever `to_confirm` can. */
function viaConfirmation(from: OrderStatus, to: OrderStatus): OrderStatus {
  return from === 'new' && !canTransition('new', to) ? 'to_confirm' : from;
}

/**
 * Pure rules of #28: no answer / busy count towards the store's limit, then the order becomes
 * `unreachable`; postponed and call-back orders come back at the chosen time.
 * Returns null when the outcome would be an illegal status move from the current status.
 */
export function planCall(input: CallPlanInput): CallPlan | null {
  const unreached = ['no_answer', 'busy'].includes(input.outcome);
  const unreachedCalls = input.unreachedCalls + (unreached ? 1 : 0);
  const status = targetStatus(input, unreachedCalls);
  if (status !== input.status && !canTransition(viaConfirmation(input.status, status), status)) {
    return null;
  }
  const nextCallAt = status === 'postponed' || status === 'to_confirm' ? input.callBackAt : null;
  return { status, nextCallAt, unreachedCalls };
}

/** Calendar day in Algeria (UTC+1, no daylight saving), used for the per-day attempt limit. */
export function algiersDay(at: Date): string {
  return new Date(at.getTime() + 60 * 60 * 1000).toISOString().slice(0, 10);
}
