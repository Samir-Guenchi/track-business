import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { EnvelopeCipher } from './envelope-cipher.js';

const cipher = new EnvelopeCipher(new Map([['v1', randomBytes(32)]]), 'v1');

describe('EnvelopeCipher', () => {
  it('round-trips a value bound to its row', () => {
    const sealed = cipher.seal('{"apiToken":"t"}', 'store-1:yalidine');

    expect(cipher.open(sealed, 'store-1:yalidine')).toBe('{"apiToken":"t"}');
    expect(Buffer.from(sealed.secret).toString()).not.toContain('apiToken');
  });

  it('refuses a ciphertext moved to another store', () => {
    const sealed = cipher.seal('secret', 'store-1:yalidine');

    expect(() => cipher.open(sealed, 'store-2:yalidine')).toThrow();
  });

  it('opens values sealed with an older key after rotation', () => {
    const old = randomBytes(32);
    const before = new EnvelopeCipher(new Map([['v1', old]]), 'v1').seal('x', 'a');
    const rotated = new EnvelopeCipher(
      new Map([
        ['v1', old],
        ['v2', randomBytes(32)],
      ]),
      'v2',
    );

    expect(rotated.open(before, 'a')).toBe('x');
    expect(rotated.seal('y', 'a').kekId).toBe('v2');
  });
});
