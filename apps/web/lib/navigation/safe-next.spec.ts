import { describe, expect, it } from 'vitest';
import { safeNextPath } from './safe-next';

describe('safeNextPath', () => {
  it('keeps a path inside the app', () => {
    expect(safeNextPath('/orders?page=2')).toBe('/orders?page=2');
  });

  it.each([null, '', 'https://evil.example', '//evil.example', '/\\evil.example', 'orders'])(
    'falls back for %s',
    (next) => {
      expect(safeNextPath(next)).toBe('/');
    },
  );
});
