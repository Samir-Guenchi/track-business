import type { DeliveryRequest } from '@trackecom/contracts';

export interface CarrierGroup {
  readonly carrier: string;
  readonly items: readonly DeliveryRequest[];
}

/** One group per carrier, oldest request first: the order a courier works through them. */
export function groupByCarrier(items: readonly DeliveryRequest[]): CarrierGroup[] {
  const groups = new Map<string, DeliveryRequest[]>();
  for (const item of items) groups.set(item.carrier, [...(groups.get(item.carrier) ?? []), item]);
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([carrier, list]) => ({
      carrier,
      items: [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    }));
}

/** Plain lines to paste in the carrier's chat or e-mail: "yal-123 · Delivery on Thursday". */
export function changeListText(
  group: CarrierGroup,
  summary: (item: DeliveryRequest) => string,
): string {
  return group.items.map((item) => `${item.trackingNumber} · ${summary(item)}`).join('\n');
}
