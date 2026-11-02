import { describe, expect, it } from 'vitest';
import { LogCallRequestSchema } from './call-attempt.schema.js';
import { ConfirmationSettingsSchema } from './confirmation-settings.schema.js';
import { SelfConfirmRequestSchema } from './self-confirm.schema.js';

const orderId = '11111111-1111-4111-8111-111111111111';

describe('confirmation contract', () => {
  it('needs a reason to cancel and a time to postpone', () => {
    const cancel = { orderId, outcome: 'cancelled', durationSec: 40 };
    const postpone = { orderId, outcome: 'postponed', durationSec: 40 };

    expect(LogCallRequestSchema.safeParse(cancel).success).toBe(false);
    expect(LogCallRequestSchema.safeParse({ ...cancel, reason: 'Trop cher' }).success).toBe(true);
    expect(LogCallRequestSchema.safeParse(postpone).success).toBe(false);
    const later = { ...postpone, callBackAt: '2026-11-02T10:00:00+01:00' };
    expect(LogCallRequestSchema.safeParse(later).success).toBe(true);
  });

  it('lets a call-back come without a time and rejects stray fields', () => {
    const callBack = { orderId, outcome: 'call_back', durationSec: 12 };

    expect(LogCallRequestSchema.safeParse(callBack).success).toBe(true);
    const busyWithDate = {
      orderId,
      outcome: 'busy',
      durationSec: 0,
      callBackAt: '2026-11-02T10:00:00Z',
    };
    expect(LogCallRequestSchema.safeParse(busyWithDate).success).toBe(false);
  });

  it('fills sensible defaults for a new store', () => {
    expect(ConfirmationSettingsSchema.parse({})).toEqual({
      assignment: 'round_robin',
      agentRules: [],
      maxAttemptsPerDay: 3,
      unreachableAfter: 6,
    });
  });
});

describe('self-confirmation contract', () => {
  it('accepts the three customer answers and nothing else', () => {
    expect(SelfConfirmRequestSchema.parse({ action: 'confirm' })).toEqual({ action: 'confirm' });
    const fix = { action: 'change_address', wilayaCode: 16, communeId: 1601, address: 'Rue 1' };
    expect(SelfConfirmRequestSchema.parse(fix)).toEqual(fix);
    expect(SelfConfirmRequestSchema.safeParse({ action: 'change_address' }).success).toBe(false);
    expect(SelfConfirmRequestSchema.safeParse({ action: 'ship' }).success).toBe(false);
  });
});
