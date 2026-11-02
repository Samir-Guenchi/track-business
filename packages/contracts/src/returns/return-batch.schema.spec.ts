import { describe, expect, it } from 'vitest';
import { CreateReturnBatchRequestSchema, MAX_RETURN_BATCH_SIZE } from './return-batch.schema.js';
import { ListExpectedReturnsQuerySchema } from './return.schema.js';

describe('return contracts', () => {
  it('treats a scanned parcel as intact unless told otherwise', () => {
    const body = CreateReturnBatchRequestSchema.parse({
      carrier: 'yalidine',
      scanned: [{ trackingNumber: ' TRK-1 ' }],
    });
    expect(body.scanned).toEqual([{ trackingNumber: 'TRK-1', condition: 'intact' }]);
  });

  it('refuses an empty or oversized scan', () => {
    const scan = { trackingNumber: 'TRK-1' };
    const huge = Array.from({ length: MAX_RETURN_BATCH_SIZE + 1 }, () => scan);
    expect(
      CreateReturnBatchRequestSchema.safeParse({ carrier: 'yalidine', scanned: [] }).success,
    ).toBe(false);
    expect(
      CreateReturnBatchRequestSchema.safeParse({ carrier: 'yalidine', scanned: huge }).success,
    ).toBe(false);
  });

  it('waits ten days before calling a return overdue', () => {
    expect(ListExpectedReturnsQuerySchema.parse({}).overdueDays).toBe(10);
    expect(ListExpectedReturnsQuerySchema.parse({ overdue: 'true' }).overdue).toBe(true);
  });
});
