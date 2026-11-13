import { describe, expect, it } from 'vitest';
import { DecideFollowupRequestSchema, ListFollowupsQuerySchema } from './followup.schema.js';

describe('DecideFollowupRequestSchema', () => {
  it('needs the stop-desk when switching to one', () => {
    expect(DecideFollowupRequestSchema.safeParse({ decision: 'switch_to_stopdesk' }).success).toBe(
      false,
    );
    expect(
      DecideFollowupRequestSchema.safeParse({ decision: 'switch_to_stopdesk', stopDeskId: 'sd-16' })
        .success,
    ).toBe(true);
  });

  it('accepts a reattempt or a return alone', () => {
    expect(DecideFollowupRequestSchema.parse({ decision: 'reattempt' }).decision).toBe('reattempt');
    expect(
      DecideFollowupRequestSchema.safeParse({ decision: 'return', note: 'refused' }).success,
    ).toBe(true);
  });
});

describe('ListFollowupsQuerySchema', () => {
  it('reads filters from the query string', () => {
    const query = ListFollowupsQuerySchema.parse({
      status: 'open',
      wilayaCode: '16',
      overdue: 'true',
    });

    expect(query).toMatchObject({ status: 'open', wilayaCode: 16, overdue: true, limit: 20 });
  });
});
