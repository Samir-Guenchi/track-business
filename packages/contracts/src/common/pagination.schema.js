import { z } from 'zod';
export const MAX_PAGE_SIZE = 100;
export const CursorQuerySchema = z.strictObject({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(20),
});
/** Builds the `{ items, nextCursor }` response schema for a list endpoint. */
export const cursorPage = (item) =>
  z.strictObject({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });
