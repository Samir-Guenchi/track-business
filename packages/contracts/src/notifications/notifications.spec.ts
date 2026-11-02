import { describe, expect, it } from 'vitest';
import { OptOutRequestSchema, UsageQuerySchema } from './message.schema.js';
import { NotificationSettingsSchema } from './notification-settings.schema.js';
import { UpdateTemplateRequestSchema } from './template.schema.js';

describe('notifications contract', () => {
  it('starts with notifications off and quiet nights', () => {
    expect(NotificationSettingsSchema.parse({})).toEqual({
      enabled: false,
      channel: 'sms',
      language: 'ar',
      triggers: ['parcel_shipped', 'out_for_delivery', 'failed_attempt'],
      quietHours: { start: 21, end: 8 },
      storeName: null,
    });
  });

  it('accepts only known placeholders in templates', () => {
    const ok = { body: 'Salam {name}, votre colis {ref} : {tracking_link}' };
    expect(UpdateTemplateRequestSchema.parse(ok)).toEqual(ok);
    expect(UpdateTemplateRequestSchema.safeParse({ body: 'Hi {phone}' }).success).toBe(false);
  });

  it('normalises opt-out phones and checks the usage month', () => {
    expect(OptOutRequestSchema.parse({ phone: '0555 00 00 01' })).toEqual({
      phone: '+213555000001',
    });
    expect(UsageQuerySchema.safeParse({ month: '2026-13' }).success).toBe(false);
  });
});
