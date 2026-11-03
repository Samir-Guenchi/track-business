import { describe, expect, it } from 'vitest';
import {
  CreateClaimRequestSchema,
  ListClaimCandidatesQuerySchema,
  UpdateClaimRequestSchema,
} from './claim.schema.js';

const shipmentId = '00000000-0000-4000-8000-000000000001';

describe('claim contracts', () => {
  it('defaults the candidate scan windows', () => {
    expect(ListClaimCandidatesQuerySchema.parse({})).toEqual({
      stuckDays: 10,
      returnMissingDays: 7,
    });
  });

  it('accepts a claim with a declared value in dinars', () => {
    const body = { shipmentId, reason: 'lost', declaredValue: 4300 };
    expect(CreateClaimRequestSchema.parse(body)).toEqual(body);
  });

  it('refuses fractional or negative amounts', () => {
    expect(
      CreateClaimRequestSchema.safeParse({ shipmentId, reason: 'lost', declaredValue: -1 }).success,
    ).toBe(false);
    expect(UpdateClaimRequestSchema.safeParse({ state: 'won', recovered: 10.5 }).success).toBe(
      false,
    );
  });

  it('refuses unknown reasons and extra keys', () => {
    expect(
      CreateClaimRequestSchema.safeParse({ shipmentId, reason: 'late', declaredValue: 1 }).success,
    ).toBe(false);
    expect(UpdateClaimRequestSchema.safeParse({ state: 'open', storeId: shipmentId }).success).toBe(
      false,
    );
  });
});
