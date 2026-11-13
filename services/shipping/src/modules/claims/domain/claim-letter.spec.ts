import { describe, expect, it } from 'vitest';
import { claimLetter, type LetterInput } from './claim-letter.js';

const input: LetterInput = {
  lang: 'fr',
  reason: 'return_missing',
  carrier: 'yalidine',
  trackingNumber: 'TRK-42',
  reference: 'TE-ABC123',
  shippedAt: new Date('2026-10-01T09:00:00Z'),
  declaredValue: 4300,
  note: null,
  events: [
    { at: new Date('2026-10-02T08:30:00Z'), label: 'En transit', location: 'Alger' },
    { at: new Date('2026-10-05T15:00:00Z'), label: 'Retourné', location: null },
  ],
};

describe('claim letter', () => {
  it('quotes the parcel, the reason, the value and the timeline in French', () => {
    const letter = claimLetter(input);
    expect(letter.subject).toBe(
      'Réclamation colis TRK-42 : le colis est indiqué comme retourné, mais nous ne l’avons jamais reçu.',
    );
    expect(letter.body).toContain('notre référence TE-ABC123');
    expect(letter.body).toContain('confié à yalidine le 01/10/2026');
    expect(letter.body).toMatch(/4\s300 DA/);
    expect(letter.body).toContain('02/10/2026 09:30 : En transit (Alger)');
    expect(letter.body).toContain('05/10/2026 16:00 : Retourné\n');
    expect(letter.body).not.toContain('Précisions');
  });

  it('writes Arabic, with the seller note, and says when no event came', () => {
    const letter = claimLetter({
      ...input,
      lang: 'ar',
      reason: 'lost',
      note: 'Client appelé',
      events: [],
    });
    expect(letter.subject).toContain('الطرد TRK-42');
    expect(letter.body).toContain('تم التصريح بضياع الطرد.');
    expect(letter.body).toContain('تفاصيل: Client appelé');
    expect(letter.body).toContain('- لم يصل أي حدث تتبع');
  });
});
