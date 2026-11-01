import type { SelfConfirmRequest } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import { type LinkRecord, answerStatus, canAnswer } from './self-confirm.js';

const now = new Date('2026-11-01T10:00:00Z');
const link: LinkRecord = {
  id: 'l1',
  storeId: 's1',
  orderId: 'o1',
  expiresAt: new Date('2026-11-02T10:00:00Z'),
  usedAt: null,
};

describe('canAnswer', () => {
  it('accepts an unused, unexpired link on an order still in confirmation', () => {
    expect(canAnswer(link, 'unreachable', now)).toBe(true);
    expect(canAnswer(link, 'new', now)).toBe(true);
  });

  it('refuses used or expired links and orders already moving', () => {
    expect(canAnswer({ ...link, usedAt: now }, 'to_confirm', now)).toBe(false);
    expect(canAnswer({ ...link, expiresAt: now }, 'to_confirm', now)).toBe(false);
    expect(canAnswer(link, 'shipped', now)).toBe(false);
  });
});

describe('answerStatus', () => {
  it('confirms, also after an address fix, and cancels', () => {
    expect(answerStatus({ action: 'confirm' }, 'unreachable')).toBe('confirmed');
    const fix: SelfConfirmRequest = {
      action: 'change_address',
      wilayaCode: 16,
      communeId: 1601,
      address: 'Rue 1',
    };
    expect(answerStatus(fix, 'to_confirm')).toBe('confirmed');
    expect(answerStatus({ action: 'cancel' }, 'new')).toBe('cancelled');
  });

  it('refuses a move the status machine does not allow', () => {
    expect(answerStatus({ action: 'confirm' }, 'shipped')).toBeNull();
  });
});
