import { describe, expect, it } from 'vitest';
import { CreateDeliveryRequestSchema } from './delivery-request.schema.js';

describe('CreateDeliveryRequestSchema', () => {
  it('accepts each kind with its own fields', () => {
    const valid = [
      { kind: 'reschedule', date: '2026-11-05' },
      { kind: 'switch_stopdesk' },
      { kind: 'fix_address', address: 'Cité 200 logements, bloc B', landmark: 'Face à la poste' },
      { kind: 'call_after', time: '17:30' },
    ];
    for (const request of valid)
      expect(CreateDeliveryRequestSchema.parse(request)).toEqual(request);
  });

  it('refuses fields that belong to another kind and bad times', () => {
    const invalid = [
      { kind: 'switch_stopdesk', date: '2026-11-05' },
      { kind: 'call_after', time: '25:00' },
      { kind: 'fix_address', address: 'x' },
      { kind: 'teleport' },
    ];
    for (const request of invalid) {
      expect(CreateDeliveryRequestSchema.safeParse(request).success).toBe(false);
    }
  });
});
