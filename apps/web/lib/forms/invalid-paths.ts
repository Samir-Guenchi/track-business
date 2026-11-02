import type { z } from 'zod';

/** Dotted paths of every rejected field, e.g. `customer.phone` or `items.0.unitPrice`. */
export function invalidPaths(error: z.ZodError): ReadonlySet<string> {
  return new Set(error.issues.map((issue) => issue.path.map(String).join('.')));
}
