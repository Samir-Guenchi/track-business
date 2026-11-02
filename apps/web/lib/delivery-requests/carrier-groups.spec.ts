import type { DeliveryRequest } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import { changeListText, groupByCarrier } from './carrier-groups';

const request = (carrier: string, trackingNumber: string, createdAt: string): DeliveryRequest => ({
  id: `00000000-0000-4000-8000-${trackingNumber.padStart(12, '0')}`,
  shipmentId: '00000000-0000-4000-8000-000000000001',
  orderId: '00000000-0000-4000-8000-000000000002',
  carrier,
  trackingNumber,
  request: { kind: 'switch_stopdesk' },
  state: 'pending',
  createdAt,
  handledAt: null,
});

describe('groupByCarrier', () => {
  it('groups by carrier, oldest request first', () => {
    const groups = groupByCarrier([
      request('zr', '3', '2026-11-02T10:00:00.000Z'),
      request('yalidine', '2', '2026-11-02T09:00:00.000Z'),
      request('yalidine', '1', '2026-11-02T08:00:00.000Z'),
    ]);
    expect(groups.map((group) => group.carrier)).toEqual(['yalidine', 'zr']);
    expect(groups[0]?.items.map((item) => item.trackingNumber)).toEqual(['1', '2']);
  });

  it('writes one pasteable line per parcel', () => {
    const [group] = groupByCarrier([request('yalidine', '1', '2026-11-02T08:00:00.000Z')]);
    expect(group && changeListText(group, () => 'Stop-desk')).toBe('1 · Stop-desk');
  });
});
