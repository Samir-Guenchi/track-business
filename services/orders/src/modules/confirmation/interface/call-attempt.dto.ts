import type { CallAttempt } from '@trackecom/contracts';
import type { CallAttemptRecord } from '../application/ports/confirmation.repository.js';

export function toCallAttemptDto(attempt: CallAttemptRecord): CallAttempt {
  return {
    id: attempt.id,
    orderId: attempt.orderId,
    agentId: attempt.agentId,
    outcome: attempt.outcome,
    reason: attempt.reason,
    note: attempt.note,
    callBackAt: attempt.callBackAt?.toISOString() ?? null,
    durationSec: attempt.durationSec,
    at: attempt.at.toISOString(),
  };
}
