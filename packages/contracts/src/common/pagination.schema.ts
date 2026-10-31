import { z } from 'zod';

export const MAX_PAGE_SIZE = 100;

export const CursorQuerySchema = z.strictObject({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(20),
});

export type CursorQuery = z.infer<typeof CursorQuerySchema>;

/** Builds the `{ items, nextCursor }` response schema for a list endpoint. */
export const cursorPage = <T extends z.ZodType>(item: T) =>
  z.strictObject({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });
