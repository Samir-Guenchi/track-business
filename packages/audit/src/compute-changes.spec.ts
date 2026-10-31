import { describe, expect, it } from 'vitest';
import { REDACTED, computeChanges } from './compute-changes.js';

describe('computeChanges', () => {
  it('keeps only the fields that changed', () => {
    const changes = computeChanges(
      { status: 'pending', note: 'x' },
      { status: 'confirmed', note: 'x' },
    );

    expect(changes).toEqual([{ field: 'status', before: 'pending', after: 'confirmed' }]);
  });

  it('records a creation as null -> value', () => {
    expect(computeChanges(null, { role: 'agent' })).toEqual([
      { field: 'role', before: null, after: 'agent' },
    ]);
  });

  it('never stores secrets', () => {
    const [change] = computeChanges({ passwordHash: 'a' }, { passwordHash: 'b' });

    expect(change).toEqual({ field: 'passwordHash', before: REDACTED, after: REDACTED });
  });

  it('masks phone numbers but still shows that they changed', () => {
    const [change] = computeChanges(
      { customerPhone: '+213555000001' },
      { customerPhone: '+213555000002' },
    );

    expect(change).toEqual({
      field: 'customerPhone',
      before: '+213****0001',
      after: '+213****0002',
    });
  });

  it('compares nested values by content', () => {
    expect(computeChanges({ address: { commune: 1601 } }, { address: { commune: 1601 } })).toEqual(
      [],
    );
  });
});
