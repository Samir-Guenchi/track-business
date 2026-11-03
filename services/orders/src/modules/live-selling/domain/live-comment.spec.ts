import { describe, expect, it } from 'vitest';
import { readLiveComment, splitComments } from './live-comment.js';

const codes = new Set(['A1', 'B2']);

describe('readLiveComment', () => {
  it('reads code, size and phone from a French comment', () => {
    expect(readLiveComment('Amina: A1 taille L 0555 12 34 56', codes)).toEqual({
      phone: '+213555123456',
      code: 'A1',
      size: 'L',
      quantity: 1,
      name: 'Amina',
    });
  });

  it('reads Arabic digits, a spaced code and a quantity', () => {
    const reading = readLiveComment('حجز b 2 مقاس 38 x2 ٠٦٦١٢٣٤٥٦٧', codes);
    expect(reading).toMatchObject({ phone: '+213661234567', code: 'B2', size: '38', quantity: 2 });
  });

  it('ignores a comment without phone or without a shown code', () => {
    expect(readLiveComment('A1 L svp', codes)).toBeNull();
    expect(readLiveComment('C3 0555123456', codes)).toBeNull();
  });

  it('does not take the phone digits for a code', () => {
    expect(readLiveComment('0555 12 34 56 A1', codes)?.code).toBe('A1');
  });
});

describe('splitComments', () => {
  it('keeps one comment per non-empty line', () => {
    expect(splitComments('A1 0555123456\n\n  B2 0661234567 \r\n')).toEqual([
      'A1 0555123456',
      'B2 0661234567',
    ]);
  });
});
