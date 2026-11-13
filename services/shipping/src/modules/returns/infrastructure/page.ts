/** Splits `limit + 1` rows into one page and the cursor of its last row, if more remain. */
export function pageOf<T>(
  rows: readonly T[],
  limit: number,
  cursorOf: (row: T) => string,
): { items: T[]; nextCursor: string | null } {
  const items = rows.slice(0, limit);
  const last = items.at(-1);
  return { items, nextCursor: rows.length > limit && last ? cursorOf(last) : null };
}
