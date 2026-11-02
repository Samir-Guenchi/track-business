import type { ReturnCondition } from '@trackecom/contracts';
import { isAnnouncedReturn } from './return-window.js';

/** A parcel of this store and carrier found for a scanned tracking number. */
export interface KnownParcel {
  readonly shipmentId: string;
  readonly orderId: string;
  readonly trackingNumber: string;
  readonly status: string;
  readonly alreadyReceived: boolean;
}

export interface ScannedParcel {
  readonly trackingNumber: string;
  readonly condition: ReturnCondition;
}

export interface Receipt {
  readonly shipmentId: string;
  readonly orderId: string;
  readonly trackingNumber: string;
  readonly condition: ReturnCondition;
  readonly unannounced: boolean;
}

export interface BatchSort {
  readonly received: Receipt[];
  readonly unknown: string[];
  readonly alreadyReceived: string[];
  readonly missing: string[];
}

const unique = <T>(items: readonly T[], key: (item: T) => string): T[] => [
  ...new Map(items.map((item) => [key(item), item])).values(),
];

/**
 * Sorts a courier's hand-over: what we receive now, what matches no parcel, what came twice,
 * and what the courier declared but did not hand over. A number scanned twice counts once.
 */
export function sortBatch(
  scanned: readonly ScannedParcel[],
  known: ReadonlyMap<string, KnownParcel>,
  declared: readonly string[] = [],
): BatchSort {
  const sort: BatchSort = { received: [], unknown: [], alreadyReceived: [], missing: [] };
  for (const scan of unique(scanned, (item) => item.trackingNumber)) {
    const parcel = known.get(scan.trackingNumber);
    if (!parcel) sort.unknown.push(scan.trackingNumber);
    else if (parcel.alreadyReceived) sort.alreadyReceived.push(scan.trackingNumber);
    else sort.received.push(toReceipt(parcel, scan.condition));
  }
  const scannedNumbers = new Set(scanned.map((item) => item.trackingNumber));
  sort.missing.push(...new Set(declared.filter((number) => !scannedNumbers.has(number))));
  return sort;
}

function toReceipt(parcel: KnownParcel, condition: ReturnCondition): Receipt {
  return {
    shipmentId: parcel.shipmentId,
    orderId: parcel.orderId,
    trackingNumber: parcel.trackingNumber,
    condition,
    unannounced: !isAnnouncedReturn(parcel.status),
  };
}
