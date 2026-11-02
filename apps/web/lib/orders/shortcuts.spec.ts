import { describe, expect, it } from 'vitest';
import { moveIndex, shortcutFor, targetStatus } from './shortcuts';

const press = (key: string, tagName = 'BODY', modifiers = {}) => ({
  key,
  target: { tagName },
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  ...modifiers,
});

describe('order list shortcuts', () => {
  it('maps j/k, arrows, Enter, c and x', () => {
    expect(
      ['j', 'ArrowDown', 'k', 'Enter', 'c', 'x'].map((key) => shortcutFor(press(key))),
    ).toEqual(['next', 'next', 'previous', 'open', 'confirm', 'cancel']);
  });

  it('ignores keys typed in a field or with a modifier', () => {
    expect(shortcutFor(press('c', 'INPUT'))).toBeUndefined();
    expect(shortcutFor(press('c', 'BODY', { ctrlKey: true }))).toBeUndefined();
  });

  it('keeps the highlight inside the list', () => {
    expect(moveIndex(-1, 'next', 3)).toBe(0);
    expect(moveIndex(2, 'next', 3)).toBe(2);
    expect(moveIndex(0, 'previous', 3)).toBe(0);
    expect(moveIndex(0, 'next', 0)).toBe(-1);
  });

  it('only offers moves the status machine allows', () => {
    expect(targetStatus('confirm', 'to_confirm')).toBe('confirmed');
    expect(targetStatus('cancel', 'shipped')).toBeUndefined();
  });
});
