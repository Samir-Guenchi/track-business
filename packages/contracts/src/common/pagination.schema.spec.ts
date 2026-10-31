import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { CursorQuerySchema, MAX_PAGE_SIZE, cursorPage } from './pagination.schema.js';

describe('CursorQuerySchema', () => {
  it('defaults the limit to 20', () => {
    expect(CursorQuerySchema.parse({}).limit).toBe(20);
  });

  it('rejects a limit above the maximum page size', () => {
    const result = CursorQuerySchema.safeParse({ limit: MAX_PAGE_SIZE + 1 });

    expect(result.success).toBe(false);
  });

  it('rejects unknown query fields', () => {
    expect(CursorQuerySchema.safeParse({ storeId: 'x' }).success).toBe(false);
  });
});

describe('cursorPage', () => {
  it('accepts the last page with a null cursor', () => {
    const page = cursorPage(z.string()).parse({ items: ['a'], nextCursor: null });

    expect(page.items).toEqual(['a']);
  });
});
