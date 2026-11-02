import { describe, expect, it } from 'vitest';
import { pickActiveStore } from './pick-active-store';

const item = (id: string) => ({
  store: { id, name: id, createdAt: '2026-11-01T00:00:00.000Z' },
  role: 'owner' as const,
});

describe('pickActiveStore', () => {
  it('keeps the remembered store while the user is a member', () => {
    expect(pickActiveStore('b', [item('a'), item('b')])).toBe('b');
  });

  it('falls back to the first store when access was removed', () => {
    expect(pickActiveStore('gone', [item('a')])).toBe('a');
  });

  it('returns null when the user has no store yet', () => {
    expect(pickActiveStore('a', [])).toBeNull();
  });
});
