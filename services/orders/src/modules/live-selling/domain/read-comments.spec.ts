import { describe, expect, it } from 'vitest';
import { readComments } from './read-comments.js';

describe('readComments', () => {
  it('keeps one reservation per phone and code and lists what it could not read', () => {
    const text = [
      'A1 L 0555123456',
      'A1 L 0555 12 34 56 svp',
      'B2 0661234567',
      'A1 taille M',
      'trop belle 😍',
    ].join('\n');
    const read = readComments(text, new Set(['A1', 'B2']));
    expect(read.readings.map((r) => `${r.code} ${r.phone}`)).toEqual([
      'A1 +213555123456',
      'B2 +213661234567',
    ]);
    expect(read.repeated).toBe(1);
    expect(read.unread).toEqual(['A1 taille M']);
  });
});
