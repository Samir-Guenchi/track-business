import { describe, expect, it } from 'vitest';
import type { OrderRecord } from '../../orders/domain/order.js';
import { statsPeriod, toAgentStats } from './agent-stats.js';
import { fillScript } from './fill-script.js';

describe('fillScript', () => {
  it('fills known placeholders and leaves unknown ones', () => {
    const order = {
      ref: 'TE-ABC123',
      codAmount: 5600,
      customer: { name: 'Amina', wilayaCode: 16 },
      items: [{ quantity: 2, name: 'Robe' }],
    } as unknown as OrderRecord;

    const text = fillScript(
      'Salam {customerName}, {orderRef}: {items}, {total} ({wilaya}) {other}',
      order,
    );

    expect(text).toBe('Salam Amina, TE-ABC123: 2 x Robe, 5600 DA (16) {other}');
  });
});

describe('toAgentStats', () => {
  it('computes rates over the active time', () => {
    const stats = toAgentStats({
      agentId: 'a',
      calls: 30,
      confirmed: 9,
      cancelled: 3,
      totalDurationSec: 1800,
      firstCallAt: new Date('2026-10-31T08:00:00Z'),
      lastCallAt: new Date('2026-10-31T11:00:00Z'),
    });

    expect(stats).toEqual({
      agentId: 'a',
      calls: 30,
      callsPerHour: 10,
      confirmed: 9,
      confirmRate: 0.75,
      averageHandleSec: 60,
    });
  });
});

describe('statsPeriod', () => {
  it('defaults to the Algiers day so far', () => {
    const now = new Date('2026-10-31T23:30:00Z');

    expect(statsPeriod(now, {}).from.toISOString()).toBe('2026-10-31T23:00:00.000Z');
  });
});
