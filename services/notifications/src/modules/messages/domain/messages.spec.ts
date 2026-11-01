import { NOTIFICATION_TRIGGERS, UpdateTemplateRequestSchema } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import { DEFAULT_TEMPLATES } from './default-templates.js';
import { isQuiet, sendTime } from './quiet-hours.js';
import { renderTemplate } from './render.js';

const values = {
  name: 'Amine',
  ref: 'TE-1042',
  tracking_link: 'https://t.example/abc',
  carrier: 'Yalidine',
  store_name: 'Boutique Test',
};

describe('renderTemplate', () => {
  it('fills every placeholder', () => {
    const body = 'Salam {name}, colis {ref} avec {carrier}: {tracking_link}';
    expect(renderTemplate(body, values)).toBe(
      'Salam Amine, colis TE-1042 avec Yalidine: https://t.example/abc',
    );
  });

  it('drops the leading store prefix when the store has no name', () => {
    expect(renderTemplate('{store_name}: colis {ref}', { ...values, store_name: '' })).toBe(
      'colis TE-1042',
    );
  });
});

describe('default templates', () => {
  it('exist for every trigger and language, and pass the template rules', () => {
    for (const trigger of NOTIFICATION_TRIGGERS) {
      for (const body of Object.values(DEFAULT_TEMPLATES[trigger])) {
        expect(UpdateTemplateRequestSchema.safeParse({ body }).success).toBe(true);
      }
    }
  });
});

describe('quiet hours', () => {
  const night = { start: 21, end: 8 };

  it('knows windows that wrap past midnight', () => {
    expect([isQuiet(22, night), isQuiet(3, night), isQuiet(8, night), isQuiet(12, night)]).toEqual([
      true,
      true,
      false,
      false,
    ]);
    expect(isQuiet(12, { start: 0, end: 0 })).toBe(false);
  });

  it('holds a message until the quiet hours end', () => {
    // 22:30 in Algiers -> 08:00 the next morning (07:00 UTC).
    expect(sendTime(new Date('2026-11-01T21:30:00Z'), night)).toEqual(
      new Date('2026-11-02T07:00:00Z'),
    );
    const noon = new Date('2026-11-01T11:00:00Z');
    expect(sendTime(noon, night)).toBe(noon);
  });
});
