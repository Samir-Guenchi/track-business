import { PARCEL_STATUSES } from '@trackecom/contracts';
import { describe, expect, it } from 'vitest';
import { PROGRESS_STEPS, progressOf } from './progress';

describe('progressOf', () => {
  it('walks the happy path step by step', () => {
    expect(PROGRESS_STEPS.map((status) => progressOf(status).reached)).toEqual([0, 1, 2, 3, 4]);
  });

  it('flags a failed attempt without moving the bar back', () => {
    expect(progressOf('failed_attempt')).toEqual({ reached: 3, tone: 'attention' });
  });

  it('stops the bar for returns and cancellations', () => {
    expect(progressOf('returned').tone).toBe('stopped');
    expect(progressOf('cancelled').tone).toBe('stopped');
  });

  it('knows every parcel status', () => {
    for (const status of PARCEL_STATUSES)
      expect(progressOf(status).reached).toBeGreaterThanOrEqual(0);
  });
});
