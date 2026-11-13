import type { CreateDeliveryRequest } from '@trackecom/contracts';

/**
 * One line for the order history. The web app translates the kind; this keeps the detail the
 * seller needs to act: the new day, the corrected address or the time to call.
 */
export function requestSummary(request: CreateDeliveryRequest): string {
  switch (request.kind) {
    case 'reschedule':
      return `reschedule: ${request.date}`;
    case 'switch_stopdesk':
      return 'switch_stopdesk';
    case 'fix_address':
      return request.landmark
        ? `fix_address: ${request.address} (${request.landmark})`
        : `fix_address: ${request.address}`;
    case 'call_after':
      return `call_after: ${request.time}`;
  }
}
