import { describe, expect, it } from 'vitest';
import { assessRisk, isGibberishName, isSuspiciousPhone, nameKey } from './risk-rules.js';

describe('isSuspiciousPhone', () => {
  it.each(['+213555555555', '+213555123456', '+213666987654', '+213770890123'])(
    'flags %s',
    (phone) => expect(isSuspiciousPhone(phone)).toBe(true),
  );

  it.each(['+213555000001', '+213661204578'])('accepts %s', (phone) =>
    expect(isSuspiciousPhone(phone)).toBe(false),
  );
});

describe('isGibberishName', () => {
  it.each(['xzkq tbr', 'Ali123', 'aaaaa', 'Mohamed ssssss'])('flags %s', (name) =>
    expect(isGibberishName(name)).toBe(true),
  );

  it.each(['Mohamed Amine', 'Lyès Brahimi', 'محمد أمين', 'Nhl'])('accepts %s', (name) =>
    expect(isGibberishName(name)).toBe(false),
  );
});

describe('nameKey', () => {
  it('ignores case, accents and spacing', () => {
    expect(nameKey('  Lyès   BRAHIMI ')).toBe('lyes brahimi');
  });
});

describe('assessRisk', () => {
  const clean = {
    phone: '+213555000001',
    name: 'Mohamed Amine',
    blacklisted: false,
    recentOrders: 0,
    communeInWilaya: true,
    refusingStores: 0,
  };

  it('finds nothing on a normal order', () => {
    expect(assessRisk(clean)).toEqual([]);
  });

  it('lists every signal found', () => {
    expect(
      assessRisk({
        phone: '+213555123456',
        name: 'xzkq',
        blacklisted: true,
        recentOrders: 2,
        communeInWilaya: false,
        refusingStores: 2,
      }),
    ).toEqual([
      'blacklisted',
      'suspicious_phone',
      'order_burst',
      'gibberish_name',
      'impossible_address',
      'network_refusals',
    ]);
    expect(assessRisk({ ...clean, recentOrders: 1 })).toEqual([]);
  });

  it('gives the benefit of the doubt when the geo data is unavailable', () => {
    expect(assessRisk({ ...clean, communeInWilaya: null })).toEqual([]);
  });

  it('needs refusals at more than one other store for the network flag', () => {
    expect(assessRisk({ ...clean, refusingStores: 1 })).toEqual([]);
  });
});
